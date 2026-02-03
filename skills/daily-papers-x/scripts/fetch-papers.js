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

// Load config for sync folder
const { ensureSyncFolder } = require('../../config-loader');

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
const CATEGORIES = {
  '人工智能 (AI & LLM)': {
    arxiv: ['cs.AI', 'cs.LG', 'cs.CL', 'cs.DB', 'cs.CR', 'cs.DS', 'cs.SE'],
    maxPapers: 15
  },
  '具身智能 (Embodied AI)': {
    arxiv: ['cs.RO', 'cs.CV', 'cs.GR', 'cs.SY'],
    maxPapers: 12
  },
  '多模态与视觉 (Multimodal & Vision)': {
    arxiv: ['cs.MM', 'eess.IV'],
    maxPapers: 10
  },
  'AI与金融结合 (AI + Finance)': {
    arxiv: ['q-fin.CP', 'q-fin.GN', 'q-fin.PM', 'q-fin.ST', 'q-fin.TR', 'q-fin.EC', 'q-fin.MF'],
    maxPapers: 8
  },
  'AI与生物医学结合 (AI + Biomedical)': {
    arxiv: ['q-bio.QM', 'q-bio.BM', 'q-bio.GN', 'q-bio.TO', 'q-bio.CB', 'q-bio.MN', 'q-bio.SC'],
    maxPapers: 10
  },
  'AI与科学计算 (AI + Science)': {
    arxiv: ['cs.NA', 'cs.SC', 'physics.comp-ph', 'physics.chem-ph', 'physics.ao-ph'],
    maxPapers: 8
  }
};

const BROAD_CATEGORIES = {
  '计算机科学 (Computer Science)': {
    arxiv: ['cs.CC', 'cs.CE', 'cs.CG', 'cs.GT', 'cs.HC'],
    maxPapers: 5
  }
};

const CONFIG = {
  totalMaxResults: 50,
  hoursBack: 168,
  minPapersThreshold: 5,
  trendingWeight: 2.5,
  recencyWeight: 2.0,
  maxPapersPerCategory: 20
};

const ALL_HOT_TOPICS = [
  ...DYNAMIC_HOT_TOPICS,
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
  'Figure', 'Figure 02', 'Figure AI', 'Helix',
  'Optimus', 'Tesla Bot', 'Tesla Optimus',
  'Atlas', 'Boston Dynamics', 'Spot', 'Stretch',
  'Digit', 'Agility Robotics',
  'Unitree', 'Unitree G1', 'Unitree H1', 'Go2', 'B2',
  'humanoid', 'bipedal',
  'VLA', 'OpenVLA', 'RT-2', 'RT-X', 'RT-1', 'π0', 'pi0', 'pi-zero',
  'Diffusion Policy', 'ACT', 'Aloha', 'Mobile ALOHA',
  'JEPA', 'I-JEPA', 'V-JEPA', 'Sora', 'Dreamer', 'World Model',
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
  'SOTA', 'state-of-the-art', 'breakthrough', 'milestone',
  'outperforms', 'beats', 'surpasses',
  'first', 'novel', 'new paradigm',
  'open source', 'open-source', 'released'
];

function ensureDependencies() {
  const pkgPath = path.join(SKILL_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    const pkg = { name: "daily-papers-x", version: "2.0.0", dependencies: { "axios": "^1.6.0" } };
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
          papers.push({ ...entry, source: 'arXiv', url: paperId, category: cat, researchCategory: catName, engagement: { likes: 0, retweets: 0, score: 0 }, trendingScore: 0, viralScore: 0 });
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
      .filter(p => { const pubDate = p.publishedAt ? new Date(p.publishedAt) : null; return !pubDate || pubDate >= cutoffTime; })
      .map(p => {
        const paper = p.paper || {};
        return { title: paper.title || p.title || 'Unknown Title', id: paper.id || p.id || '', abstract: (p.summary || paper.abstract || 'No abstract available').substring(0, 500) + '...', authors: paper.authors?.map(a => a.name).filter(Boolean) || ['Unknown'], category: 'Hugging Face', researchCategory: 'Hugging Face Daily', source: 'Hugging Face', url: paper.url || `https://arxiv.org/abs/${paper.id}`, published: p.publishedAt || new Date().toISOString(), engagement: { likes: p.numLikes || 0, retweets: 0, score: p.numLikes || 0 }, trendingScore: 0, viralScore: 0 };
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
        entries.push({ title: title.replace(/\s+/g, ' '), id: id, abstract: summary ? summary.substring(0, 500) + (summary.length > 500 ? '...' : '') : 'No abstract available', authors: authors.length > 0 ? authors : ['Unknown'], published: published || new Date().toISOString() });
      }
    } catch (e) {}
  }
  return entries;
}

function calculateTrendingScore(paper) {
  const text = ((paper.title || '') + ' ' + (paper.abstract || '')).toLowerCase();
  let score = 0;
  let matchedSignals = [];
  for (const topic of ALL_HOT_TOPICS) {
    if (text.includes(topic.toLowerCase())) {
      score += 1.5;
      if (!matchedSignals.includes(topic) && matchedSignals.length < 10) matchedSignals.push(topic);
    }
  }
  const pubTime = new Date(paper.published);
  const hoursAgo = (Date.now() - pubTime.getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 6) { score += 2; matchedSignals.push('⚡ 6h内'); }
  else if (hoursAgo <= 24) { score += 1.5; matchedSignals.push('⚡ 24h内'); }
  else if (hoursAgo <= 72) { score += 1; matchedSignals.push('⚡ 72h内'); }
  if (paper.engagement?.likes > 10) { score += Math.log10(paper.engagement.likes); matchedSignals.push(`👍 ${paper.engagement.likes}`); }
  return { score: Math.min(Math.round(score * 10) / 10, 15), signals: matchedSignals.slice(0, 8) };
}

async function searchPapers(hoursBack = 168) {
  console.log(`\n🔍 Searching arXiv categories (last ${hoursBack}h)...\n`);
  let papers = await searchArxiv(CATEGORIES, hoursBack, 30);
  console.log(`\n  Main categories: ${papers.length} papers`);
  const broadPapers = await searchArxiv(BROAD_CATEGORIES, hoursBack, 15);
  console.log(`  Broad categories: ${broadPapers.length} papers`);
  papers.push(...broadPapers);
  console.log('\n🔍 Searching Hugging Face...');
  const hfPapers = await searchHuggingFace(hoursBack);
  console.log(`  Hugging Face: ${hfPapers.length} papers`);
  papers.push(...hfPapers);
  console.log('\n📊 Calculating trending scores...');
  papers.forEach(p => { const trending = calculateTrendingScore(p); p.trendingScore = trending.score; p.trendingSignals = trending.signals; });
  papers.sort((a, b) => b.trendingScore - a.trendingScore);
  console.log(`\n📚 Total unique papers: ${papers.length}`);
  const byCategory = {};
  papers.forEach(p => { const cat = p.researchCategory || 'Other'; if (!byCategory[cat]) byCategory[cat] = []; byCategory[cat].push(p); });
  console.log('\n📈 Category breakdown:');
  for (const [cat, ps] of Object.entries(byCategory)) {
    const avgTrending = ps.reduce((sum, p) => sum + (p.trendingScore || 0), 0) / (ps.length || 1);
    console.log(`  ${cat}: ${ps.length} papers (avg trending: ${avgTrending.toFixed(1)})`);
  }
  return papers.slice(0, CONFIG.totalMaxResults);
}

// Select top 20 papers with at least 5 from AI&LLM and 5 from Embodied AI
function selectTop20Papers(allPapers) {
  allPapers.sort((a, b) => b.trendingScore - a.trendingScore);
  const selected = [];
  const aiLLMPapers = allPapers.filter(p => p.researchCategory?.includes('人工智能'));
  const embodiedPapers = allPapers.filter(p => p.researchCategory?.includes('具身智能'));
  const otherPapers = allPapers.filter(p => !p.researchCategory?.includes('人工智能') && !p.researchCategory?.includes('具身智能'));
  selected.push(...aiLLMPapers.slice(0, 5));
  selected.push(...embodiedPapers.slice(0, 5));
  const remainingSlots = 20 - selected.length;
  const remainingPapers = allPapers.filter(p => !selected.includes(p));
  selected.push(...remainingPapers.slice(0, remainingSlots));
  selected.sort((a, b) => b.trendingScore - a.trendingScore);
  console.log(`\n📋 Selected top 20 papers:`);
  console.log(`  AI & LLM: ${selected.filter(p => p.researchCategory?.includes('人工智能')).length}`);
  console.log(`  Embodied AI: ${selected.filter(p => p.researchCategory?.includes('具身智能')).length}`);
  console.log(`  Others: ${selected.filter(p => !p.researchCategory?.includes('人工智能') && !p.researchCategory?.includes('具身智能')).length}`);
  return selected;
}

// Select 4 featured papers + 1 Top Pick from top 20
function selectFeaturedPapers(top20Papers) {
  if (!top20Papers || top20Papers.length === 0) return null;
  const papers = top20Papers;
  const mostTrending = papers[0];
  const interestingKeywords = ['novel', 'creative', 'innovative', 'surprising', 'unexpected', 'breakthrough', 'first'];
  const mostInteresting = papers.reduce((best, p) => {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    const score = interestingKeywords.filter(kw => text.includes(kw)).length;
    const bestScore = interestingKeywords.filter(kw => ((best?.title || '') + ' ' + (best?.abstract || '')).toLowerCase().includes(kw)).length;
    return score > bestScore ? p : best;
  }, papers[1] || papers[0]);
  const deepKeywords = ['theoretical', 'framework', 'analysis', 'mechanism', 'understanding', 'interpretability', 'proof', 'theorem', 'mathematical'];
  const mostDeep = papers.reduce((best, p) => {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    const score = deepKeywords.filter(kw => text.includes(kw)).length;
    const bestScore = deepKeywords.filter(kw => ((best?.title || '') + ' ' + (best?.abstract || '')).toLowerCase().includes(kw)).length;
    return score > bestScore ? p : best;
  }, papers[2] || papers[0]);
  const valuableKeywords = ['application', 'real-world', 'deployment', 'practical', 'medical', 'clinical', 'financial', 'industry', 'production'];
  const mostValuable = papers.reduce((best, p) => {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    let score = valuableKeywords.filter(kw => text.includes(kw)).length;
    if (p.researchCategory?.includes('生物医学') || p.researchCategory?.includes('金融')) score += 2;
    const bestText = ((best?.title || '') + ' ' + (best?.abstract || '')).toLowerCase();
    let bestScore = valuableKeywords.filter(kw => bestText.includes(kw)).length;
    if (best?.researchCategory?.includes('生物医学') || best?.researchCategory?.includes('金融')) bestScore += 2;
    return score > bestScore ? p : best;
  }, papers[3] || papers[0]);
  const candidates = [mostTrending, mostInteresting, mostDeep, mostValuable].filter(Boolean);
  const topPick = candidates.reduce((best, p) => (p.trendingScore || 0) > (best?.trendingScore || 0) ? p : best, candidates[0]);
  return { topPick, mostTrending: mostTrending !== topPick ? mostTrending : null, mostInteresting: mostInteresting !== topPick ? mostInteresting : null, mostDeep: mostDeep !== topPick ? mostDeep : null, mostValuable: mostValuable !== topPick ? mostValuable : null };
}

function generateFullReport(top20, featured, date, hoursBack) {
  const dateStr = getDateString(new Date(date));
  const byCategory = {};
  top20.forEach(p => { const cat = p.researchCategory || 'Other'; if (!byCategory[cat]) byCategory[cat] = []; byCategory[cat].push(p); });
  let md = `# Daily AI Papers - ${dateStr}\n\n> 🔥 **Enhanced Edition** - Top 20 papers with featured selection\n> ⏰ Search range: Last ${hoursBack} hours (${Math.round(hoursBack/24)} days)\n> 📚 Sources: arXiv (15+ categories), Hugging Face\n> 🎯 Hot topics: ${DYNAMIC_HOT_TOPICS.length} from hot-topic-vocabulary\n\n## 📊 Summary\n\n**Top 20 papers** selected from all sources.\n- Minimum 5 from AI & LLM\n- Minimum 5 from Embodied AI\n- Highest trending scores\n\n| 研究方向 | Papers | Avg Trending |\n|---------|--------|-------------|\n`;
  Object.entries(byCategory).forEach(([cat, ps]) => { const avgTrending = ps.reduce((sum, p) => sum + (p.trendingScore || 0), 0) / (ps.length || 1); md += `| ${cat} | ${ps.length} | ${avgTrending.toFixed(1)} |\n`; });
  md += `\n### 🔥 Top Trending Signals\n\n`;
  const allSignals = top20.flatMap(p => p.trendingSignals || []).filter(Boolean);
  const signalCounts = {};
  allSignals.forEach(s => signalCounts[s] = (signalCounts[s] || 0) + 1);
  const topSignals = Object.entries(signalCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  topSignals.forEach(([signal, count]) => { md += `- **${signal}**: ${count} papers\n`; });
  if (featured?.topPick) {
    const tp = featured.topPick;
    md += `\n---\n\n## 🏆 TOP PICK\n\n### ${tp.title}\n\n**Authors**: ${tp.authors.join(', ')}  \n**Source**: ${tp.source} | **Category**: ${tp.researchCategory}  \n**Published**: ${new Date(tp.published).toLocaleDateString()}  \n**🔥 Trending Score**: ${tp.trendingScore}  \n`;
    if (tp.trendingSignals?.length) md += `**Hot Signals**: ${tp.trendingSignals.slice(0, 5).join(', ')}  \n`;
    md += `\n${tp.abstract}\n\n🔗 [Paper](${tp.url})\n`;
  }
  if (featured) {
    md += `\n---\n\n## ⭐ Featured Papers\n\n`;
    if (featured.mostTrending) { md += `### 🔥 最有流量 (Most Trending)\n\n**${featured.mostTrending.title}**\n\nTrending Score: ${featured.mostTrending.trendingScore}  \nSignals: ${featured.mostTrending.trendingSignals?.slice(0, 3).join(', ') || 'N/A'}  \n${featured.mostTrending.abstract.substring(0, 300)}...\n\n🔗 ${featured.mostTrending.url}\n\n---\n\n`; }
    if (featured.mostInteresting) { md += `### 🎨 最有趣 (Most Interesting)\n\n**${featured.mostInteresting.title}**\n\nTrending Score: ${featured.mostInteresting.trendingScore}  \n${featured.mostInteresting.abstract.substring(0, 300)}...\n\n🔗 ${featured.mostInteresting.url}\n\n---\n\n`; }
    if (featured.mostDeep) { md += `### 🧠 最有深度 (Most Deep)\n\n**${featured.mostDeep.title}**\n\nTrending Score: ${featured.mostDeep.trendingScore}  \n${featured.mostDeep.abstract.substring(0, 300)}...\n\n🔗 ${featured.mostDeep.url}\n\n---\n\n`; }
    if (featured.mostValuable) { md += `### 💎 最有价值 (Most Valuable)\n\n**${featured.mostValuable.title}**\n\nTrending Score: ${featured.mostValuable.trendingScore}  \n${featured.mostValuable.abstract.substring(0, 300)}...\n\n🔗 ${featured.mostValuable.url}\n`; }
  }
  md += `\n---\n\n## 📋 Top 20 Papers\n\n`;
  top20.forEach((p, i) => { md += `${i + 1}. **${p.title}**\n   🔥 ${p.trendingScore} | ${p.researchCategory} | ${new Date(p.published).toLocaleDateString()}\n   🔗 ${p.url}\n\n`; });
  md += `\n---\n*Generated by daily-papers-x v2.0*  \n*Last updated: ${new Date().toLocaleString()}*`;
  return md;
}

function generateWhatsAppSummary(featured) {
  if (!featured || !featured.topPick) return `📚 Daily AI Papers - ${getDateString()}\n\n⚠️ No featured papers today.`;
  
  const tp = featured.topPick;
  let msg = `\n`;
  msg += `╔════════════════════════════════════╗\n`;
  msg += `║      ⭐⭐⭐ TOP PICK ⭐⭐⭐        ║\n`;
  msg += `╚════════════════════════════════════╝\n\n`;
  msg += `📌 ${tp.title}\n\n`;
  msg += `🔥 热度: ${tp.trendingScore}\n`;
  msg += `📁 ${tp.researchCategory}\n`;
  if (tp.trendingSignals?.length) msg += `📈 ${tp.trendingSignals.slice(0, 3).join(', ')}\n`;
  msg += `🔗 ${tp.url}\n`;
  msg += `════════════════════════════════════\n\n`;
  msg += `📚 其他精选:\n\n`;
  if (featured.mostTrending) msg += `🔥 最有流量\n${featured.mostTrending.title.substring(0, 70)}${featured.mostTrending.title.length > 70 ? '...' : ''}\n🔗 ${featured.mostTrending.url}\n\n`;
  if (featured.mostInteresting) msg += `🎨 最有趣\n${featured.mostInteresting.title.substring(0, 70)}${featured.mostInteresting.title.length > 70 ? '...' : ''}\n🔗 ${featured.mostInteresting.url}\n\n`;
  if (featured.mostDeep) msg += `🧠 最有深度\n${featured.mostDeep.title.substring(0, 70)}${featured.mostDeep.title.length > 70 ? '...' : ''}\n🔗 ${featured.mostDeep.url}\n\n`;
  if (featured.mostValuable) msg += `💎 最有价值\n${featured.mostValuable.title.substring(0, 70)}${featured.mostValuable.title.length > 70 ? '...' : ''}\n🔗 ${featured.mostValuable.url}\n`;
  return msg;
}

async function main() {
  try {
    ensureDependencies();
    console.log('🚀 Daily Papers X - Enhanced Edition\n');
    console.log(`📚 Dynamic hot topics: ${DYNAMIC_HOT_TOPICS.length} loaded`);
    console.log(`⏰ Search range: ${CONFIG.hoursBack} hours (${Math.round(CONFIG.hoursBack/24)} days)`);
    console.log(`📊 ArXiv categories: Main ${Object.keys(CATEGORIES).length} + Broad ${Object.keys(BROAD_CATEGORIES).length}`);
    let allPapers = await searchPapers(CONFIG.hoursBack);
    if (allPapers.length === 0) {
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
    const top20 = selectTop20Papers(allPapers);
    const featured = selectFeaturedPapers(top20);
    const date = new Date();
    const fullReport = generateFullReport(top20, featured, date, CONFIG.hoursBack);
    const memoryDir = path.join(WORKSPACE, 'memory');
    if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
    const mdPath = path.join(memoryDir, `papers-${getDateString(date)}.md`);
    fs.writeFileSync(mdPath, fullReport, 'utf8');
    console.log(`\n✅ Full report: ${mdPath}`);
    
    // Also save to sync folder for user access (from config)
    const syncFolder = ensureSyncFolder();
    if (syncFolder) {
      try {
        const syncPath = path.join(syncFolder, `papers-${getDateString(date)}.md`);
        fs.writeFileSync(syncPath, fullReport, 'utf8');
        console.log(`✅ Synced to: ${syncPath}`);
      } catch (e) {
        console.warn(`⚠️  Could not sync to folder: ${e.message}`);
      }
    }
    
    const whatsappSummary = generateWhatsAppSummary(featured);
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
