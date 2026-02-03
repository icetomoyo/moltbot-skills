#!/usr/bin/env node
/**
 * Daily Papers from X - Enhanced Edition
 * - Dynamic hot topics from hot-topic-vocabulary
 * - Broader arXiv categories for comprehensive coverage
 * - Multi-source: arXiv, Hugging Face, cross-reference trending signals
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_DIR = __dirname;
const WORKSPACE = process.env.WORKSPACE || '/Users/icetomoyo/clawd';

// Load dynamic hot topics from hot-topic-vocabulary skill
function loadDynamicHotTopics() {
  try {
    const hotTopicsPath = path.join(WORKSPACE, 'skills', 'hot-topic-vocabulary', 'output', 'hot-topics-latest.json');
    if (fs.existsSync(hotTopicsPath)) {
      const data = JSON.parse(fs.readFileSync(hotTopicsPath, 'utf8'));
      const allKeywords = [];
      
      for (const [category, catData] of Object.entries(data.categories || {})) {
        if (catData.keywords) {
          allKeywords.push(...catData.keywords.map(k => k.word));
        }
      }
      
      console.log(`📚 Loaded ${allKeywords.length} dynamic hot topics from hot-topic-vocabulary`);
      return [...new Set(allKeywords)]; // Remove duplicates
    }
  } catch (e) {
    console.log('⚠️ Failed to load dynamic hot topics:', e.message);
  }
  return [];
}

const DYNAMIC_HOT_TOPICS = loadDynamicHotTopics();

// Research Categories - Based on CATEGORIES_REVIEW.md
// Removed duplicates: cs.CV, cs.GR moved to Multimodal; cs.AI, cs.LG removed from Science
const CATEGORIES = {
  '人工智能 (AI & LLM)': {
    arxiv: ['cs.AI', 'cs.LG', 'cs.CL', 'cs.DB', 'cs.CR', 'cs.DS', 'cs.SE'],
    keywords: [],
    maxPapers: 15
  },
  '具身智能 (Embodied AI)': {
    arxiv: ['cs.RO', 'cs.CV', 'cs.GR', 'cs.SY'],
    keywords: [],
    maxPapers: 12
  },
  '多模态与视觉 (Multimodal & Vision)': {
    arxiv: ['cs.MM', 'eess.IV'],
    keywords: [],
    maxPapers: 10
  },
  'AI与金融结合 (AI + Finance)': {
    arxiv: ['q-fin.CP', 'q-fin.GN', 'q-fin.PM', 'q-fin.ST', 'q-fin.TR', 'q-fin.EC', 'q-fin.MF'],
    keywords: [],
    maxPapers: 8
  },
  'AI与生物医学结合 (AI + Biomedical)': {
    arxiv: ['q-bio.QM', 'q-bio.BM', 'q-bio.GN', 'q-bio.TO', 'q-bio.CB', 'q-bio.MN', 'q-bio.SC'],
    keywords: [],
    maxPapers: 10
  },
  'AI与科学计算 (AI + Science)': {
    arxiv: ['cs.NA', 'cs.SC', 'physics.comp-ph', 'physics.chem-ph', 'physics.ao-ph'],
    keywords: [],
    maxPapers: 8
  }
};

// Additional broad categories
const BROAD_CATEGORIES = {
  '计算机科学 (Computer Science)': {
    arxiv: ['cs.CC', 'cs.CE', 'cs.CG', 'cs.GT', 'cs.HC'],
    maxPapers: 5
  }
};

const CONFIG = {
  totalMaxResults: 50,
  hoursBack: 168,  // Default: 7 days
  minPapersThreshold: 5,
  trendingWeight: 2.5,
  recencyWeight: 2.0,
  maxPapersPerCategory: 20  // For broad categories
};

// Compile all hot topics for trending detection
const ALL_HOT_TOPICS = [
  // From hot-topic-vocabulary
  ...DYNAMIC_HOT_TOPICS,
  
  // Core AI Models
  'GPT', 'GPT-4', 'GPT-4o', 'GPT-5', 'o1', 'o3', 'Operator', 'Agentic AI', 'Deep Research',
  'Claude', 'Claude 3', 'Claude 4', 'Claude Code', 'Computer Use',
  'Gemini', 'Gemini 2', 'Gemini 2.5', 'Astra',
  'DeepSeek', 'DeepSeek-V3', 'DeepSeek-R1', 'DeepSeek-R2',
  'Llama', 'Llama 3', 'Llama 4', 'Llama 3.1', 'Llama 3.2', 'Llama 3.3',
  'Grok', 'Grok 2', 'Grok 3', 'xAI',
  'Kimi', 'Kimi k1.5', 'Kimi k1.6', 'Moonshot',
  'Qwen', 'Qwen 2.5', 'Qwen 3', 'Qwq',
  'Mistral', 'Mixtral', 'Pixtral', 'Codestral',
  'Phi', 'Phi-4', 'Microsoft',
  'Gemma', 'Gemma 2', 'Gemma 3',
  
  // Robotics
  'Figure', 'Figure 02', 'Figure AI', 'Helix',
  'Optimus', 'Tesla Bot', 'Tesla Optimus',
  'Atlas', 'Boston Dynamics', 'Spot', 'Stretch',
  'Digit', 'Agility Robotics',
  'Unitree', 'Unitree G1', 'Unitree H1', 'Go2', 'B2',
  'humanoid', 'bipedal',
  
  // VLA & Robot Learning
  'VLA', 'OpenVLA', 'RT-2', 'RT-X', 'RT-1', 'π0', 'pi0', 'pi-zero',
  'Diffusion Policy', 'ACT', 'Aloha', 'Mobile ALOHA',
  
  // World Models
  'JEPA', 'I-JEPA', 'V-JEPA', 'Sora', 'Dreamer', 'World Model',
  
  // Technical
  'LLM', 'large language model', 'foundation model',
  'transformer', 'attention', 'Mamba', 'RNN', 'LSTM',
  'reasoning', 'chain-of-thought', 'CoT',
  'LoRA', 'QLoRA', 'PEFT',
  'RAG', 'retrieval augmented',
  'agent', 'AI agent', 'multi-agent',
  'RLHF', 'reinforcement learning',
  'multimodal', 'VLM', 'vision language',
  'quantization', 'distillation', 'pruning',
  'MoE', 'mixture of experts',
  'long context', 'context window',
  
  // Viral indicators
  'SOTA', 'state-of-the-art', 'breakthrough', 'milestone',
  'outperforms', 'beats', 'surpasses',
  'first', 'novel', 'new paradigm',
  'open source', 'open-source', 'released'
];

function ensureDependencies() {
  const pkgPath = path.join(SKILL_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    const pkg = {
      name: "daily-papers-x",
      version: "2.0.0",
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

async function searchArxiv(categories, hoursBack = 168, maxPerCat = 30) {
  const papers = [];
  const seenIds = new Set();
  let catCount = 0;
  const totalCats = Object.values(categories).reduce((sum, c) => sum + (c.arxiv?.length || 0), 0);
  
  for (const [catName, catConfig] of Object.entries(categories)) {
    const arxivCats = catConfig.arxiv || [];
    
    for (const cat of arxivCats) {
      catCount++;
      try {
        // Add delay to avoid rate limiting
        if (catCount > 1) await new Promise(r => setTimeout(r, 500));
        
        const url = `http://export.arxiv.org/api/query?search_query=cat:${cat}&start=0&max_results=${maxPerCat}&sortBy=submittedDate&sortOrder=descending`;
        process.stdout.write(`  [${catCount}/${totalCats}] Fetching ${cat}... `);
        
        const response = await fetchWithRetry(url);
        const entries = parseArxivFeed(response.data);
        
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
        
        let added = 0;
        for (const entry of entries) {
          if (new Date(entry.published) < cutoffTime) continue;
          
          const paperId = entry.id.replace('/abs/', '/pdf/');
          if (seenIds.has(paperId)) continue;
          seenIds.add(paperId);
          
          papers.push({
            ...entry,
            source: 'arXiv',
            url: paperId,
            category: cat,
            researchCategory: catName,
            engagement: { likes: 0, retweets: 0, score: 0 },
            trendingScore: 0,
            viralScore: 0
          });
          added++;
        }
        console.log(`${added} papers`);
      } catch (e) {
        console.log(`failed: ${e.message}`);
      }
    }
  }
  
  return papers;
}

async function searchHuggingFace(hoursBack = 168) {
  try {
    const url = 'https://huggingface.co/api/daily_papers';
    const response = await fetchWithRetry(url);
    
    if (!Array.isArray(response.data)) return [];
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    
    return response.data
      .filter(p => {
        const pubDate = p.publishedAt ? new Date(p.publishedAt) : null;
        return !pubDate || pubDate >= cutoffTime;
      })
      .map(p => {
        const paper = p.paper || {};
        return {
          title: paper.title || p.title || 'Unknown Title',
          id: paper.id || p.id || '',
          abstract: (p.summary || paper.abstract || 'No abstract available').substring(0, 500) + '...',
          authors: paper.authors?.map(a => a.name).filter(Boolean) || ['Unknown'],
          category: 'Hugging Face',
          researchCategory: 'Hugging Face Daily',
          source: 'Hugging Face',
          url: paper.url || `https://arxiv.org/abs/${paper.id}`,
          published: p.publishedAt || new Date().toISOString(),
          engagement: { likes: p.numLikes || 0, retweets: 0, score: p.numLikes || 0 },
          trendingScore: 0,
          viralScore: 0
        };
      });
  } catch (e) {
    console.error('  ⚠️ Hugging Face failed:', e.message);
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

function calculateTrendingScore(paper) {
  const text = ((paper.title || '') + ' ' + (paper.abstract || '')).toLowerCase();
  let score = 0;
  let matchedSignals = [];
  
  // Check hot topics
  for (const topic of ALL_HOT_TOPICS) {
    if (text.includes(topic.toLowerCase())) {
      score += 1.5;
      if (!matchedSignals.includes(topic) && matchedSignals.length < 10) {
        matchedSignals.push(topic);
      }
    }
  }
  
  // Recency bonus (6h = +2, 24h = +1, 72h = +0.5)
  const pubTime = new Date(paper.published);
  const hoursAgo = (Date.now() - pubTime.getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 6) {
    score += 2;
    matchedSignals.push('⚡ 6h内');
  } else if (hoursAgo <= 24) {
    score += 1.5;
    matchedSignals.push('⚡ 24h内');
  } else if (hoursAgo <= 72) {
    score += 1;
    matchedSignals.push('⚡ 72h内');
  }
  
  // Hugging Face engagement
  if (paper.engagement?.likes > 10) {
    score += Math.log10(paper.engagement.likes);
    matchedSignals.push(`👍 ${paper.engagement.likes}`);
  }
  
  return {
    score: Math.min(Math.round(score * 10) / 10, 15),
    signals: matchedSignals.slice(0, 8)
  };
}

async function searchPapers(hoursBack = 168) {
  console.log(`\n🔍 Searching arXiv categories (last ${hoursBack}h)...\n`);
  
  // Search main categories (30 per category to balance speed and coverage)
  let papers = await searchArxiv(CATEGORIES, hoursBack, 30);
  console.log(`\n  Main categories: ${papers.length} papers`);
  
  // Search broad categories (smaller limit)
  const broadPapers = await searchArxiv(BROAD_CATEGORIES, hoursBack, 15);
  console.log(`  Broad categories: ${broadPapers.length} papers`);
  papers.push(...broadPapers);
  
  // Search Hugging Face
  console.log('\n🔍 Searching Hugging Face...');
  const hfPapers = await searchHuggingFace(hoursBack);
  console.log(`  Hugging Face: ${hfPapers.length} papers`);
  papers.push(...hfPapers);
  
  // Calculate trending scores
  console.log('\n📊 Calculating trending scores...');
  papers.forEach(p => {
    const trending = calculateTrendingScore(p);
    p.trendingScore = trending.score;
    p.trendingSignals = trending.signals;
  });
  
  // Sort by trending score
  papers.sort((a, b) => b.trendingScore - a.trendingScore);
  
  console.log(`\n📚 Total unique papers: ${papers.length}`);
  
  // Category breakdown
  const byCategory = {};
  papers.forEach(p => {
    const cat = p.researchCategory || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  });
  
  console.log('\n📈 Category breakdown:');
  for (const [cat, ps] of Object.entries(byCategory)) {
    const avgTrending = ps.reduce((sum, p) => sum + (p.trendingScore || 0), 0) / (ps.length || 1);
    console.log(`  ${cat}: ${ps.length} papers (avg trending: ${avgTrending.toFixed(1)})`);
  }
  
  return papers.slice(0, CONFIG.totalMaxResults);
}

function selectFeaturedPapers(papers) {
  if (!papers || papers.length === 0) return null;

  return {
    mostTrending: papers.reduce((max, p) => (p.trendingScore || 0) > (max?.trendingScore || 0) ? p : max, papers[0]),
    mostRecommended: papers[0], // Already sorted by trending
    mostPopular: papers.reduce((max, p) => (p.engagement?.score || 0) > (max?.engagement?.score || 0) ? p : max, papers[0]),
    mostRecent: papers.reduce((max, p) => new Date(p.published) > new Date(max?.published || 0) ? p : max, papers[0])
  };
}

function generateFullReport(papers, featured, date, hoursBack) {
  const dateStr = getDateString(new Date(date));
  
  const byCategory = {};
  papers.forEach(p => {
    const cat = p.researchCategory || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  });

  let md = `# Daily AI Papers - ${dateStr}

> 🔥 **Enhanced Edition** - Dynamic hot topics + Broad category coverage
> ⏰ Search range: Last ${hoursBack} hours (${Math.round(hoursBack/24)} days)
> 📚 Sources: arXiv (15+ categories), Hugging Face
> 🎯 Hot topics: ${DYNAMIC_HOT_TOPICS.length} from hot-topic-vocabulary

## 📊 Summary

**${papers.length} papers** across **${Object.keys(byCategory).length}** research areas.

| 研究方向 | Papers | Avg Trending |
|---------|--------|-------------|
`;

  Object.entries(byCategory).forEach(([cat, ps]) => {
    const avgTrending = ps.reduce((sum, p) => sum + (p.trendingScore || 0), 0) / (ps.length || 1);
    md += `| ${cat} | ${ps.length} | ${avgTrending.toFixed(1)} |
`;
  });

  // Top trending signals
  md += `\n### 🔥 Top Trending Signals\n\n`;
  const allSignals = papers.flatMap(p => p.trendingSignals || []).filter(Boolean);
  const signalCounts = {};
  allSignals.forEach(s => signalCounts[s] = (signalCounts[s] || 0) + 1);
  const topSignals = Object.entries(signalCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  
  topSignals.forEach(([signal, count]) => {
    md += `- **${signal}**: ${count} papers\n`;
  });

  // Featured papers
  if (featured) {
    md += `\n---\n\n## ⭐ Featured Papers\n\n`;
    
    if (featured.mostTrending) {
      md += `### 🔥 Most Trending\n\n**${featured.mostTrending.title}**\n\n`;
      md += `Score: ${featured.mostTrending.trendingScore}/15  \n`;
      md += `Signals: ${featured.mostTrending.trendingSignals?.join(', ') || 'N/A'}  \n`;
      md += `${featured.mostTrending.abstract}\n\n`;
      md += `🔗 ${featured.mostTrending.url}\n\n---\n\n`;
    }
    
    if (featured.mostRecent && featured.mostRecent !== featured.mostTrending) {
      md += `### ⚡ Most Recent\n\n**${featured.mostRecent.title}**\n\n`;
      md += `Published: ${new Date(featured.mostRecent.published).toLocaleString()}  \n`;
      md += `${featured.mostRecent.abstract}\n\n`;
      md += `🔗 ${featured.mostRecent.url}\n\n---\n\n`;
    }
  }

  // All papers by category
  for (const [cat, ps] of Object.entries(byCategory)) {
    md += `\n---\n\n## 🔬 ${cat}\n\n`;
    ps.forEach((p, i) => {
      md += `### ${i + 1}. ${p.title}\n\n`;
      md += `**Authors**: ${p.authors.join(', ')}  \n`;
      md += `**Source**: ${p.source}  \n`;
      md += `**Published**: ${new Date(p.published).toLocaleDateString()}  \n`;
      md += `**🔥 Trending**: ${p.trendingScore || 0}  \n`;
      if (p.trendingSignals?.length) {
        md += `**Signals**: ${p.trendingSignals.slice(0, 5).join(', ')}\n`;
      }
      md += `\n${p.abstract}\n\n`;
      md += `🔗 [Paper](${p.url})\n\n---\n\n`;
    });
  }

  md += `\n---\n*Generated by daily-papers-x v2.0*  \n*Last updated: ${new Date().toLocaleString()}*`;

  return md;
}

function generateWhatsAppSummary(papers, featured) {
  const byCategory = {};
  papers.forEach(p => {
    const cat = p.researchCategory || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });
  
  let msg = `📚 Daily AI Papers - ${getDateString()}
`;
  msg += `🔥 Enhanced Edition | ${papers.length} papers | ${DYNAMIC_HOT_TOPICS.length} hot topics
\n`;
  
  msg += `📈 Category breakdown:\n`;
  for (const [cat, count] of Object.entries(byCategory).slice(0, 6)) {
    const shortName = cat.split(' ')[0];
    msg += `   ${shortName}: ${count}篇\n`;
  }
  
  // Top trending signals
  const allSignals = papers.flatMap(p => p.trendingSignals || []).filter(Boolean);
  const signalCounts = {};
  allSignals.forEach(s => signalCounts[s] = (signalCounts[s] || 0) + 1);
  const topSignals = Object.entries(signalCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  if (topSignals.length > 0) {
    msg += `\n🔥 Hot topics: `;
    msg += topSignals.map(([s, c]) => `${s}(${c})`).join(' | ');
    msg += '\n';
  }

  // Most Trending
  if (featured?.mostTrending) {
    const t = featured.mostTrending;
    msg += `\n🏆 TOP PICK\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📌 ${t.title}\n\n`;
    msg += `🔥 Trending: ${t.trendingScore}/15\n`;
    msg += `📈 Signals: ${t.trendingSignals?.slice(0, 3).join(', ') || 'N/A'}\n`;
    msg += `🔗 ${t.url}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  // Top papers list
  msg += `\n📋 Top Papers:\n`;
  papers.slice(0, 12).forEach((p, i) => {
    const icon = (p.trendingScore || 0) >= 5 ? '🔥' : (p.trendingScore || 0) >= 3 ? '⭐' : '•';
    msg += `${icon} ${p.title.substring(0, 60)}${p.title.length > 60 ? '...' : ''}\n`;
  });

  if (papers.length > 12) {
    msg += `\n... and ${papers.length - 12} more\n`;
  }

  msg += `\n📄 Full report: memory/papers-${getDateString()}.md`;

  return msg;
}

async function main() {
  try {
    ensureDependencies();
    
    console.log('🚀 Daily Papers X - Enhanced Edition\n');
    console.log(`📚 Dynamic hot topics: ${DYNAMIC_HOT_TOPICS.length} loaded`);
    console.log(`⏰ Search range: ${CONFIG.hoursBack} hours (${Math.round(CONFIG.hoursBack/24)} days)`);
    console.log(`📊 ArXiv categories: Main ${Object.keys(CATEGORIES).length} + Broad ${Object.keys(BROAD_CATEGORIES).length}`);
    
    let papers = await searchPapers(CONFIG.hoursBack);
    
    if (papers.length === 0) {
      console.log('\n⚠️ No papers found');
      
      const memoryDir = path.join(WORKSPACE, 'memory');
      if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
      
      const emptyMsg = `📚 Daily AI Papers - ${getDateString()}\n\n⚠️ No papers found in last ${CONFIG.hoursBack} hours\n\nTry again later! 📖`;
      
      console.log('\n📱 WhatsApp Message:');
      console.log('---WHATSAPP_MESSAGE_START---');
      console.log(emptyMsg);
      console.log('---WHATSAPP_MESSAGE_END---');
      
      process.exit(0);
    }
    
    const featured = selectFeaturedPapers(papers);
    const date = new Date();
    
    // Save full report
    const fullReport = generateFullReport(papers, featured, date, CONFIG.hoursBack);
    const memoryDir = path.join(WORKSPACE, 'memory');
    if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
    
    const mdPath = path.join(memoryDir, `papers-${getDateString(date)}.md`);
    fs.writeFileSync(mdPath, fullReport, 'utf8');
    console.log(`\n✅ Full report: ${mdPath}`);
    
    // Generate WhatsApp summary
    const whatsappSummary = generateWhatsAppSummary(papers, featured);
    const msgPath = path.join(memoryDir, `papers-${getDateString(date)}-summary.txt`);
    fs.writeFileSync(msgPath, whatsappSummary, 'utf8');
    console.log(`✅ WhatsApp summary: ${msgPath}`);
    
    console.log('\n📱 WhatsApp Message:\n');
    console.log('---WHATSAPP_MESSAGE_START---');
    console.log(whatsappSummary);
    console.log('---WHATSAPP_MESSAGE_END---');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
