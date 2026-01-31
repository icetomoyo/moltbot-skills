#!/usr/bin/env node
/**
 * Daily Papers from X - Concise version for WhatsApp
 * Generates both full report (saved locally) and summary (sent to WhatsApp)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_DIR = __dirname;
const WORKSPACE = process.env.WORKSPACE || '/Users/icetomoyo/clawd';

// Research Categories
const CATEGORIES = {
  'AI/ML': {
    arxiv: ['cs.AI', 'cs.LG', 'cs.CL'],
    keywords: ['artificial intelligence', 'machine learning', 'deep learning', 'LLM', 'transformer'],
    maxPapers: 5
  },
  'Robotics/Embodied AI': {
    arxiv: ['cs.RO', 'cs.AI'],
    keywords: ['robotics', 'embodied AI', 'manipulation', 'navigation', 'humanoid'],
    maxPapers: 5
  },
  'AI + Economy/Finance': {
    arxiv: ['cs.AI', 'q-fin.CP', 'q-fin.GN'],
    keywords: ['finance', 'economy', 'trading', 'market', 'fintech', 'economic'],
    maxPapers: 4
  },
  'AI + Biomedical/Medicine': {
    arxiv: ['cs.AI', 'cs.CV', 'q-bio.QM', 'q-bio.BM'],
    keywords: ['biomedical', 'medical', 'healthcare', 'drug', 'protein', 'diagnosis', 'clinical'],
    maxPapers: 5
  }
};

const CONFIG = {
  totalMaxResults: 20,
  hoursBack: parseInt(process.env.HOURS_BACK || '24', 10),
  minPapersThreshold: 3,  // 如果少于3篇，自动扩大搜索范围
  fallbackHoursBack: 48   // 回退搜索范围
};

function ensureDependencies() {
  const pkgPath = path.join(SKILL_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    const pkg = {
      name: "daily-papers-x",
      version: "1.0.0",
      dependencies: { "axios": "^1.6.0" }
    };
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
  
  const modulePath = path.join(SKILL_DIR, 'node_modules', 'axios');
  if (!fs.existsSync(modulePath)) {
    console.error('📦 Installing dependencies...');
    try {
      execSync('npm install', { cwd: SKILL_DIR, stdio: 'inherit', timeout: 120000 });
    } catch (e) {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  }
}

function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  const axios = require('axios');
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { timeout: 30000, ...options });
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

// Search functions remain the same...
async function searchArxivByCategory(categoryName, config, hoursBack = 24) {
  const papers = [];
  const arxivCats = config.arxiv || ['cs.AI'];
  
  for (const cat of arxivCats) {
    try {
      const url = `http://export.arxiv.org/api/query?search_query=cat:${cat}&start=0&max_results=${hoursBack > 24 ? 20 : 10}&sortBy=submittedDate&sortOrder=descending`;
      const response = await fetchWithRetry(url);
      const entries = parseArxivFeed(response.data);
      
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
      
      let recent = entries.filter(e => new Date(e.published) >= cutoffTime);
      
      if (config.keywords && config.keywords.length > 0) {
        recent = recent.filter(e => {
          const text = (e.title + ' ' + e.abstract).toLowerCase();
          return config.keywords.some(kw => text.includes(kw.toLowerCase()));
        });
      }
      
      papers.push(...recent.map(p => ({
        ...p,
        source: 'arXiv',
        url: p.id.replace('/abs/', '/pdf/'),
        category: cat,
        engagement: { likes: 0, retweets: 0, score: 0 }
      })));
    } catch (e) {
      console.error(`    ⚠️ arXiv ${cat} failed:`, e.message);
    }
  }
  
  return papers;
}

async function searchHuggingFaceByCategory(categoryName, config, hoursBack = 24) {
  try {
    const url = 'https://huggingface.co/api/daily_papers';
    const response = await fetchWithRetry(url);
    
    if (!Array.isArray(response.data)) return [];
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    
    let papers = response.data.filter(p => {
      const pubDate = p.publishedAt ? new Date(p.publishedAt) : null;
      return !pubDate || pubDate >= cutoffTime;
    });
    
    if (config.keywords && config.keywords.length > 0) {
      papers = papers.filter(p => {
        const paper = p.paper || {};
        const text = ((p.title || paper.title || '') + ' ' + (p.summary || paper.abstract || '')).toLowerCase();
        return config.keywords.some(kw => text.includes(kw.toLowerCase()));
      });
    }
    
    return papers.map(p => {
      const paper = p.paper || {};
      return {
        title: paper.title || p.title || 'Unknown Title',
        id: paper.id || p.id || '',
        abstract: (p.summary || paper.abstract || 'No abstract available').substring(0, 500) + '...',
        authors: paper.authors?.map(a => a.name).filter(Boolean) || ['Unknown'],
        category: categoryName,
        source: 'Hugging Face',
        url: paper.url || `https://arxiv.org/abs/${paper.id}`,
        published: p.publishedAt || new Date().toISOString(),
        engagement: { likes: p.numLikes || 0, retweets: 0, score: p.numLikes || 0 }
      };
    });
  } catch (e) {
    return [];
  }
}

function parseArxivFeed(xml) {
  const entries = [];
  const entryMatches = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/g) || [];
  
  for (const entryBlock of entryMatches) {
    try {
      const title = (entryBlock.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim() || '';
      const id = (entryBlock.match(/<id>([\s\S]*?)<\/id>/) || [])[1]?.trim() || '';
      const summary = (entryBlock.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.trim() || '';
      const published = (entryBlock.match(/<published>([\s\S]*?)<\/published>/) || [])[1]?.trim() || '';
      
      const authorMatches = entryBlock.match(/<author[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g) || [];
      const authors = authorMatches.map(a => a.match(/<name>([\s\S]*?)<\/name>/)?.[1]?.trim()).filter(Boolean);
      
      if (title && id) {
        entries.push({
          title: title.replace(/\s+/g, ' '),
          id: id,
          abstract: summary ? summary.substring(0, 500) + (summary.length > 500 ? '...' : '') : 'No abstract available',
          authors: authors.length > 0 ? authors : ['Unknown'],
          published: published || new Date().toISOString()
        });
      }
    } catch (e) {}
  }
  
  return entries;
}

async function searchPapers(hoursBack = 24) {
  const papersByCategory = {};
  
  for (const [categoryName, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📂 Searching: ${categoryName} (${hoursBack}h)`);
    papersByCategory[categoryName] = [];
    
    try {
      const arxivPapers = await searchArxivByCategory(categoryName, config, hoursBack);
      papersByCategory[categoryName].push(...arxivPapers);
      console.log(`  ✅ arXiv: ${arxivPapers.length}`);
    } catch (e) {}
    
    try {
      const hfPapers = await searchHuggingFaceByCategory(categoryName, config, hoursBack);
      papersByCategory[categoryName].push(...hfPapers);
      console.log(`  ✅ Hugging Face: ${hfPapers.length}`);
    } catch (e) {}
    
    papersByCategory[categoryName] = papersByCategory[categoryName]
      .slice(0, config.maxPapers)
      .map(p => ({ ...p, researchCategory: categoryName }));
  }
  
  let allPapers = [];
  for (const papers of Object.values(papersByCategory)) {
    allPapers.push(...papers);
  }
  
  const seen = new Set();
  const unique = allPapers.filter(p => {
    const key = p.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  console.log(`\n📊 Category breakdown:`);
  for (const [cat, papers] of Object.entries(papersByCategory)) {
    console.log(`  ${cat}: ${papers.length}`);
  }
  
  return unique.slice(0, CONFIG.totalMaxResults);
}

// Select featured papers
function selectFeaturedPapers(papers) {
  if (!papers || papers.length === 0) return null;

  const interestingKeywords = ['breakthrough', 'novel', 'first', 'new paradigm', 'surprising', 'unexpected', 'creative', 'innovative'];
  const deepKeywords = ['theoretical', 'framework', 'analysis', 'mechanism', 'understanding', 'interpretability'];
  const valuableKeywords = ['application', 'real-world', 'deployment', 'medical', 'clinical', 'financial'];

  const featured = {
    mostInteresting: null,
    mostPopular: null,
    mostDeep: null,
    mostValuable: null,
    mostRecommended: null
  };

  // Most Interesting
  let maxScore = -1;
  for (const p of papers) {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    const score = interestingKeywords.filter(kw => text.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      featured.mostInteresting = p;
    }
  }
  if (!featured.mostInteresting) featured.mostInteresting = papers[0];

  // Most Popular
  featured.mostPopular = papers.reduce((max, p) => 
    (p.engagement?.score || 0) > (max?.engagement?.score || 0) ? p : max, papers[0]);

  // Most Deep
  maxScore = -1;
  for (const p of papers) {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    const keywordScore = deepKeywords.filter(kw => text.includes(kw)).length;
    const lengthScore = Math.min((p.abstract?.length || 0) / 100, 5);
    const totalScore = keywordScore * 2 + lengthScore;
    if (totalScore > maxScore) {
      maxScore = totalScore;
      featured.mostDeep = p;
    }
  }
  if (!featured.mostDeep) featured.mostDeep = papers[0];

  // Most Valuable
  maxScore = -1;
  for (const p of papers) {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    let score = valuableKeywords.filter(kw => text.includes(kw)).length;
    if (p.researchCategory?.includes('Biomedical')) score += 2;
    if (p.researchCategory?.includes('Finance')) score += 2;
    if (score > maxScore) {
      maxScore = score;
      featured.mostValuable = p;
    }
  }
  if (!featured.mostValuable) featured.mostValuable = papers[papers.length - 1] || papers[0];

  // Most Recommended -综合考虑创新性、影响力和实用价值
  let bestScore = -1;
  let bestReason = '';
  
  for (const p of papers) {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    
    // 计算各项得分
    const noveltyScore = interestingKeywords.filter(kw => text.includes(kw)).length * 3;
    const impactScore = (p.engagement?.score || 0) * 2;
    const depthScore = deepKeywords.filter(kw => text.includes(kw)).length * 2;
    const practicalScore = valuableKeywords.filter(kw => text.includes(kw)).length * 2.5;
    
    // 额外加分项
    let bonusScore = 0;
    let reasons = [];
    
    if (text.includes('llm') || text.includes('large language model') || text.includes('transformer')) {
      bonusScore += 2;
      reasons.push('LLM架构创新');
    }
    if (text.includes('attention') || text.includes('efficient')) {
      bonusScore += 1.5;
      reasons.push('注意力机制优化');
    }
    if (text.includes('long context') || text.includes('scaling')) {
      bonusScore += 1.5;
      reasons.push('长上下文/规模化');
    }
    if (text.includes('real-world') || text.includes('deployment') || text.includes('application')) {
      bonusScore += 2;
      reasons.push('实际应用价值');
    }
    
    const totalScore = noveltyScore + impactScore + depthScore + practicalScore + bonusScore;
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      featured.mostRecommended = {
        ...p,
        recommendScore: totalScore,
        recommendReasons: reasons.length > 0 ? reasons : ['综合评分最高']
      };
    }
  }
  
  if (!featured.mostRecommended) {
    featured.mostRecommended = {
      ...papers[0],
      recommendScore: 0,
      recommendReasons: ['默认推荐']
    };
  }

  return featured;
}

// Generate full report (saved locally)
function generateFullReport(papers, featured, date) {
  const dateStr = getDateString(new Date(date));
  
  const byCategory = {};
  papers.forEach(p => {
    const cat = p.researchCategory || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  });

  let md = `# Daily AI Papers - ${dateStr}

> 🎯 Research Areas: AI/ML • Robotics/Embodied AI • AI+Finance • AI+Biomedical  
> 📊 Sources: arXiv, Hugging Face  
> ⏰ Time Range: Last 24 hours  

## 📈 Summary

Found **${papers.length}** papers across **${Object.keys(byCategory).length}** areas.

| Research Area | Papers |
|---------------|--------|
`;

  Object.entries(byCategory).forEach(([cat, ps]) => {
    md += `| ${cat} | ${ps.length} |\n`;
  });

  // Full papers by category
  for (const [cat, ps] of Object.entries(byCategory)) {
    md += `\n---\n\n## 🔬 ${cat}\n\n`;
    ps.forEach((p, i) => {
      md += `### ${i + 1}. ${p.title}\n\n`;
      md += `**Authors**: ${p.authors.join(', ')}  \n`;
      md += `**Source**: ${p.source}  \n`;
      md += `**Published**: ${new Date(p.published).toLocaleDateString()}\n\n`;
      md += `**Abstract**: ${p.abstract}\n\n`;
      md += `🔗 [Paper URL](${p.url})\n\n---\n\n`;
    });
  }

  // Featured papers
  if (featured) {
    md += `\n---\n\n## ⭐ Featured Papers\n\n`;
    
    // Most Recommended
    if (featured.mostRecommended) {
      md += `### 🏆 Most Recommended: ${featured.mostRecommended.title}\n\n`;
      md += `**推荐理由:** ${featured.mostRecommended.recommendReasons.join(', ')}\n\n`;
      md += `${featured.mostRecommended.abstract}\n\n`;
      md += `🔗 ${featured.mostRecommended.url}\n\n---\n\n`;
    }
    
    if (featured.mostInteresting) {
      md += `### 🎨 Most Interesting: ${featured.mostInteresting.title}\n\n`;
      md += `${featured.mostInteresting.abstract}\n\n`;
      md += `🔗 ${featured.mostInteresting.url}\n\n---\n\n`;
    }
    
    if (featured.mostPopular) {
      md += `### 🔥 Most Popular: ${featured.mostPopular.title}\n\n`;
      md += `${featured.mostPopular.abstract}\n\n`;
      md += `🔗 ${featured.mostPopular.url}\n\n---\n\n`;
    }
    
    if (featured.mostDeep) {
      md += `### 🧠 Most Deep: ${featured.mostDeep.title}\n\n`;
      md += `${featured.mostDeep.abstract}\n\n`;
      md += `🔗 ${featured.mostDeep.url}\n\n---\n\n`;
    }
    
    if (featured.mostValuable) {
      md += `### 💎 Most Valuable: ${featured.mostValuable.title}\n\n`;
      md += `${featured.mostValuable.abstract}\n\n`;
      md += `🔗 ${featured.mostValuable.url}\n\n`;
    }
  }

  md += `\n---\n\n*Generated by daily-papers-x skill*  \n*Last updated: ${new Date().toLocaleString()}*\n`;

  return md;
}

// Generate WhatsApp summary
function generateWhatsAppSummary(papers, featured) {
  let msg = `📚 Daily AI Papers - ${getDateString()}\n\n`;
  msg += `📊 Found ${papers.length} papers\n\n`;

  // Most Recommended (put first for emphasis)
  if (featured && featured.mostRecommended) {
    const rec = featured.mostRecommended;
    msg += `🏆 今日最推荐 TOP PICK\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📌 ${rec.title}\n\n`;
    msg += `📝 ${rec.abstract.substring(0, 400)}...\n\n`;
    msg += `✨ 推荐理由:\n`;
    rec.recommendReasons.forEach((reason, i) => {
      msg += `   ${i + 1}. ${reason}\n`;
    });
    msg += `\n🔗 ${rec.url}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  }

  // All papers list
  msg += `📋 All Papers:\n`;
  papers.forEach((p, i) => {
    msg += `${i + 1}. ${p.title}\n   🔗 ${p.url}\n`;
  });

  // Featured papers with details
  if (featured) {
    msg += `\n---\n\n⭐ Featured Papers:\n\n`;

    if (featured.mostInteresting) {
      msg += `🎨 Most Interesting:\n`;
      msg += `${featured.mostInteresting.title}\n`;
      msg += `${featured.mostInteresting.abstract.substring(0, 300)}...\n`;
      msg += `🔗 ${featured.mostInteresting.url}\n\n`;
    }

    if (featured.mostPopular) {
      msg += `🔥 Most Popular:\n`;
      msg += `${featured.mostPopular.title}\n`;
      msg += `${featured.mostPopular.abstract.substring(0, 300)}...\n`;
      msg += `🔗 ${featured.mostPopular.url}\n\n`;
    }

    if (featured.mostDeep) {
      msg += `🧠 Most Deep:\n`;
      msg += `${featured.mostDeep.title}\n`;
      msg += `${featured.mostDeep.abstract.substring(0, 300)}...\n`;
      msg += `🔗 ${featured.mostDeep.url}\n\n`;
    }

    if (featured.mostValuable) {
      msg += `💎 Most Valuable:\n`;
      msg += `${featured.mostValuable.title}\n`;
      msg += `${featured.mostValuable.abstract.substring(0, 300)}...\n`;
      msg += `🔗 ${featured.mostValuable.url}\n`;
    }
  }

  msg += `\n📄 Full report saved to: memory/papers-${getDateString()}.md\n`;

  return msg;
}

async function main() {
  try {
    ensureDependencies();
    
    console.log('🚀 Starting daily papers search...\n');
    console.log(`⏰ Search range: ${CONFIG.hoursBack} hours`);
    
    // First attempt with default hoursBack
    let papers = await searchPapers(CONFIG.hoursBack);
    console.log(`\n📚 Total: ${papers.length} papers`);
    
    // If not enough papers and not already using fallback, try wider range
    if (papers.length < CONFIG.minPapersThreshold && CONFIG.hoursBack < CONFIG.fallbackHoursBack) {
      console.log(`\n⚠️ Only ${papers.length} papers found (threshold: ${CONFIG.minPapersThreshold})`);
      console.log(`🔄 Expanding search to ${CONFIG.fallbackHoursBack} hours...\n`);
      
      papers = await searchPapers(CONFIG.fallbackHoursBack);
      console.log(`\n📚 Total after expansion: ${papers.length} papers`);
    }
    
    if (papers.length === 0) {
      console.log('\n⚠️ No papers found');
      
      // Save empty result marker
      const memoryDir = path.join(WORKSPACE, 'memory');
      if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
      }
      const emptyMarker = path.join(memoryDir, `papers-${getDateString()}-empty.txt`);
      fs.writeFileSync(emptyMarker, `No papers found on ${getDateString()}\nSearch range: ${CONFIG.fallbackHoursBack} hours`, 'utf8');
      
      // Output for WhatsApp
      console.log('\n📱 WhatsApp Message:');
      console.log('---WHATSAPP_MESSAGE_START---');
      console.log(`📚 Daily AI Papers - ${getDateString()}\n\n🔍 搜索了最近 ${CONFIG.fallbackHoursBack} 小时的论文\n\n⚠️ 暂无新论文发布\n\n明天再试试！ 📖`);
      console.log('---WHATSAPP_MESSAGE_END---');
      
      process.exit(0);
    }
    
    const featured = selectFeaturedPapers(papers);
    const date = new Date();
    
    // Generate full report (saved locally)
    const fullReport = generateFullReport(papers, featured, date);
    const memoryDir = path.join(WORKSPACE, 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    const mdPath = path.join(memoryDir, `papers-${getDateString(date)}.md`);
    fs.writeFileSync(mdPath, fullReport, 'utf8');
    console.log(`✅ Full report saved: ${mdPath}`);
    
    // Generate WhatsApp summary (output to console for message tool)
    const whatsappSummary = generateWhatsAppSummary(papers, featured);
    
    // Save WhatsApp message to file for easy sending
    const msgPath = path.join(memoryDir, `papers-${getDateString(date)}-summary.txt`);
    fs.writeFileSync(msgPath, whatsappSummary, 'utf8');
    console.log(`✅ WhatsApp summary saved: ${msgPath}`);
    
    // Output the summary (this will be captured and sent)
    console.log('\n📱 WhatsApp Message:\n');
    console.log('---WHATSAPP_MESSAGE_START---');
    console.log(whatsappSummary);
    console.log('---WHATSAPP_MESSAGE_END---');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
