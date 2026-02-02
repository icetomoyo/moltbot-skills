#!/usr/bin/env node
/**
 * Hot Topic Vocabulary Analyzer
 * Analyzes AI/tech trends and generates updated hot topic vocabulary
 * Runs every 4-8 hours via cron
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_DIR = __dirname;
const WORKSPACE = process.env.WORKSPACE || '/Users/icetomoyo/clawd';
const OUTPUT_DIR = path.join(SKILL_DIR, '..', 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Base categories structure
const CATEGORIES = {
  ai: { name: 'AI Models', keywords: [], trends: [] },
  robotics: { name: 'Robotics', keywords: [], trends: [] },
  agents: { name: 'AI Agents', keywords: [], trends: [] },
  vla: { name: 'VLA & Robot Learning', keywords: [], trends: [] },
  worldModels: { name: 'World Models', keywords: [], trends: [] },
  multimodal: { name: 'Multimodal', keywords: [], trends: [] },
  infra: { name: 'Infrastructure', keywords: [], trends: [] },
  safety: { name: 'Safety & Alignment', keywords: [], trends: [] },
  opensource: { name: 'Open Source', keywords: [], trends: [] },
  apps: { name: 'Applications', keywords: [], trends: [] }
};

// Seed keywords for each category (base vocabulary)
const SEED_KEYWORDS = {
  ai: ['GPT', 'Claude', 'Llama', 'Gemini', 'DeepSeek', 'Grok', 'Kimi', 'Qwen', 'Mistral', 'Phi'],
  robotics: ['Figure', 'Optimus', 'Atlas', 'Spot', 'Digit', 'Unitree', 'humanoid', 'bipedal'],
  agents: ['Agent', 'AutoGPT', 'Devin', 'Cursor', 'Copilot', 'Computer Use'],
  vla: ['VLA', 'OpenVLA', 'RT-2', 'Diffusion Policy', 'ACT', 'Aloha'],
  worldModels: ['JEPA', 'Sora', 'Dreamer', 'World Model'],
  multimodal: ['Multimodal', 'VLM', 'Image Generation', 'Video Generation'],
  infra: ['Training', 'Inference', 'LoRA', 'Quantization', 'RAG', 'MoE'],
  safety: ['Safety', 'Alignment', 'RLHF', 'Interpretability'],
  opensource: ['Open Source', 'HuggingFace', 'GitHub', 'Llama.cpp'],
  apps: ['Coding', 'Medical', 'Legal', 'Finance', 'Education']
};

// Fetch from multiple sources
async function fetchAllSources() {
  console.log('🔥 Hot Topic Vocabulary Analyzer\n');
  console.log(`⏰ ${new Date().toLocaleString('zh-CN')}\n`);
  
  const allTexts = [];
  
  // 1. arXiv recent papers
  console.log('📄 Fetching arXiv papers...');
  try {
    const axios = require('axios');
    const url = 'http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.RO&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending';
    const response = await axios.get(url, { timeout: 15000 });
    
    // Parse XML
    const entries = response.data.match(/<entry[^>]*>([\s\S]*?)<\/entry>/g) || [];
    for (const entry of entries) {
      const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const summary = (entry.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1] || '';
      allTexts.push(title + ' ' + summary);
    }
    console.log(`   ✅ ${entries.length} papers`);
  } catch (e) {
    console.error('   ❌ arXiv failed:', e.message);
  }
  
  // 2. Hacker News
  console.log('🟠 Fetching HackerNews...');
  try {
    const axios = require('axios');
    const queries = ['AI', 'LLM', 'GPT', 'Claude', 'robotics'];
    
    for (const query of queries) {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>20&hitsPerPage=10`;
      const response = await axios.get(url, { timeout: 10000 });
      const hits = response.data?.hits || [];
      
      for (const hit of hits) {
        allTexts.push(hit.title);
      }
    }
    console.log(`   ✅ HackerNews fetched`);
  } catch (e) {
    console.error('   ❌ HackerNews failed:', e.message);
  }
  
  // 3. Reddit (limited)
  console.log('👽 Fetching Reddit...');
  try {
    const axios = require('axios');
    const subs = ['MachineLearning', 'LocalLLaMA'];
    
    for (const sub of subs) {
      try {
        const url = `https://www.reddit.com/r/${sub}/hot.json?limit=15`;
        const response = await axios.get(url, { 
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VocabBot/1.0)' }
        });
        
        const posts = response.data?.data?.children || [];
        for (const post of posts) {
          allTexts.push(post.data.title);
        }
      } catch (e) {
        // Continue
      }
    }
    console.log(`   ✅ Reddit fetched`);
  } catch (e) {
    console.error('   ❌ Reddit failed:', e.message);
  }
  
  console.log(`\n📊 Total texts collected: ${allTexts.length}`);
  return allTexts;
}

// Extract keywords using simple NLP
function extractKeywords(texts) {
  console.log('\n🧠 Analyzing keywords...');
  
  // Combine all text
  const allText = texts.join(' ').toLowerCase();
  
  // Word frequency analysis
  const words = allText.match(/\b[a-zA-Z][a-zA-Z0-9\-\.]{2,}\b/g) || [];
  const wordFreq = {};
  
  for (const word of words) {
    // Filter common stop words
    if (isStopWord(word)) continue;
    
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }
  
  // Get top words
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .filter(([word, count]) => count >= 3) // At least 3 mentions
    .slice(0, 200); // Top 200 words
  
  console.log(`   ✅ Found ${sortedWords.length} candidate keywords`);
  return sortedWords;
}

// Check if word is a stop word
function isStopWord(word) {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'way', 'many', 'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea', 'eye', 'ago', 'off', 'too', 'any', 'say', 'man', 'try', 'ask', 'end', 'why', 'let', 'put', 'say', 'she', 'try', 'way', 'own', 'say', 'too', 'old', 'tell', 'very', 'when', 'much', 'would', 'there', 'their', 'what', 'said', 'each', 'which', 'will', 'about', 'could', 'other', 'after', 'first', 'never', 'these', 'think', 'where', 'being', 'every', 'great', 'might', 'shall', 'still', 'those', 'while', 'this', 'that', 'with', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'than', 'them', 'well', 'were', 'paper', 'model', 'based', 'using', 'used', 'show', 'shows', 'results', 'approach', 'proposed', 'method', 'methods', 'system', 'systems'
  ]);
  return stopWords.has(word.toLowerCase());
}

// Categorize keywords
function categorizeKeywords(keywords) {
  console.log('\n📂 Categorizing keywords...');
  
  const categorized = JSON.parse(JSON.stringify(CATEGORIES));
  
  // Initialize with seed keywords
  for (const [cat, seeds] of Object.entries(SEED_KEYWORDS)) {
    if (categorized[cat]) {
      categorized[cat].keywords = seeds.map(k => ({ word: k, score: 10, source: 'seed' }));
    }
  }
  
  // Categorize extracted keywords
  for (const [word, count] of keywords) {
    const category = determineCategory(word);
    if (category && categorized[category]) {
      categorized[category].keywords.push({
        word: word,
        score: Math.min(count * 2, 20), // Score based on frequency, max 20
        source: 'extracted'
      });
    }
  }
  
  // Sort by score and deduplicate
  for (const cat of Object.keys(categorized)) {
    const seen = new Set();
    categorized[cat].keywords = categorized[cat].keywords
      .filter(k => {
        if (seen.has(k.word.toLowerCase())) return false;
        seen.add(k.word.toLowerCase());
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 30); // Keep top 30 per category
  }
  
  return categorized;
}

// Determine category for a keyword
function determineCategory(word) {
  const lower = word.toLowerCase();
  
  // AI Models
  if (/gpt|claude|llama|gemini|deepseek|grok|kimi|qwen|mistral|phi|gemma|nemotron|rwkv/.test(lower)) return 'ai';
  
  // Robotics
  if (/figure|optimus|atlas|spot|digit|unitree|humanoid|bipedal|quadruped|robot/.test(lower)) return 'robotics';
  
  // Agents
  if (/agent|autogpt|devin|cursor|copilot|computer.use/.test(lower)) return 'agents';
  
  // VLA
  if (/vla|openvla|rt-2|diffusion.policy|act|aloha/.test(lower)) return 'vla';
  
  // World Models
  if (/jepa|sora|dreamer|world.model/.test(lower)) return 'worldModels';
  
  // Multimodal
  if (/multimodal|vlm|image.generation|video.generation|dalle|midjourney|stable.diffusion/.test(lower)) return 'multimodal';
  
  // Infrastructure
  if (/training|inference|lora|quantization|rag|moe|embedding/.test(lower)) return 'infra';
  
  // Safety
  if (/safety|alignment|rlhf|interpretability|jailbreak/.test(lower)) return 'safety';
  
  // Open Source
  if (/open.source|huggingface|github|llama.cpp/.test(lower)) return 'opensource';
  
  // Applications
  if (/coding|medical|legal|finance|education/.test(lower)) return 'apps';
  
  return null;
}

// Generate report
function generateReport(categorized) {
  console.log('\n📝 Generating report...');
  
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    totalKeywords: Object.values(categorized).reduce((sum, cat) => sum + cat.keywords.length, 0),
    categories: categorized
  };
  
  // Save JSON
  const jsonPath = path.join(OUTPUT_DIR, `vocabulary-${timestamp.slice(0, 19).replace(/:/g, '-')}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  
  // Save latest
  const latestPath = path.join(OUTPUT_DIR, 'hot-topics-latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2), 'utf8');
  
  // Generate Markdown report
  let md = `# Hot Topic Vocabulary Report\n\n`;
  md += `Generated: ${new Date().toLocaleString('zh-CN')}\n\n`;
  md += `Total Keywords: ${report.totalKeywords}\n\n`;
  
  for (const [key, cat] of Object.entries(categorized)) {
    md += `## ${cat.name} (${cat.keywords.length})\n\n`;
    for (const kw of cat.keywords.slice(0, 15)) {
      md += `- **${kw.word}** (score: ${kw.score}, ${kw.source})\n`;
    }
    md += '\n';
  }
  
  const mdPath = path.join(OUTPUT_DIR, 'trend-report.md');
  fs.writeFileSync(mdPath, md, 'utf8');
  
  console.log(`   ✅ Saved: ${path.basename(jsonPath)}`);
  console.log(`   ✅ Saved: hot-topics-latest.json`);
  console.log(`   ✅ Saved: trend-report.md`);
  
  return { jsonPath, latestPath, mdPath };
}

// Update ai-trend-monitor with new vocabulary
function updateAITrendMonitor(categorized) {
  console.log('\n🔄 Updating ai-trend-monitor vocabulary...');
  
  try {
    const monitorPath = path.join(WORKSPACE, 'skills', 'ai-trend-monitor', 'scripts', 'monitor.js');
    
    if (!fs.existsSync(monitorPath)) {
      console.log('   ⚠️  ai-trend-monitor not found, skipping update');
      return;
    }
    
    // Read current monitor.js
    let content = fs.readFileSync(monitorPath, 'utf8');
    
    // Build new HOT_TOPICS object
    const newHotTopics = {};
    for (const [key, cat] of Object.entries(categorized)) {
      newHotTopics[key] = cat.keywords.map(k => k.word);
    }
    
    // Replace HOT_TOPICS in monitor.js
    const hotTopicsRegex = /const HOT_TOPICS = \{[\s\S]*?\};/;
    const newHotTopicsStr = `const HOT_TOPICS = ${JSON.stringify(newHotTopics, null, 2)};`;
    
    if (hotTopicsRegex.test(content)) {
      content = content.replace(hotTopicsRegex, newHotTopicsStr);
      fs.writeFileSync(monitorPath, content, 'utf8');
      console.log('   ✅ ai-trend-monitor updated with new vocabulary');
    } else {
      console.log('   ⚠️  Could not find HOT_TOPICS in monitor.js');
    }
    
  } catch (e) {
    console.error('   ❌ Failed to update ai-trend-monitor:', e.message);
  }
}

// Generate WhatsApp summary
function generateWhatsAppSummary(categorized) {
  let msg = `🔥 热点词汇更新\n`;
  msg += `⏰ ${new Date().toLocaleTimeString('zh-CN')}\n\n`;
  
  // Top keywords from each category
  for (const [key, cat] of Object.entries(categorized).slice(0, 5)) {
    const topWords = cat.keywords.slice(0, 5).map(k => k.word).join(', ');
    msg += `📌 ${cat.name}:\n`;
    msg += `   ${topWords}\n\n`;
  }
  
  msg += `📊 共 ${Object.values(categorized).reduce((sum, c) => sum + c.keywords.length, 0)} 个关键词`;
  
  return msg;
}

// Main function
async function main() {
  // 1. Fetch data
  const texts = await fetchAllSources();
  
  if (texts.length === 0) {
    console.log('\n⚠️  No data collected, exiting');
    return;
  }
  
  // 2. Extract keywords
  const keywords = extractKeywords(texts);
  
  // 3. Categorize
  const categorized = categorizeKeywords(keywords);
  
  // 4. Generate report
  const paths = generateReport(categorized);
  
  // 5. Update ai-trend-monitor
  updateAITrendMonitor(categorized);
  
  // 6. Output for WhatsApp
  const whatsappMsg = generateWhatsAppSummary(categorized);
  
  console.log('\n📱 WhatsApp Summary:');
  console.log('---WHATSAPP_MESSAGE_START---');
  console.log(whatsappMsg);
  console.log('---WHATSAPP_MESSAGE_END---');
  
  console.log('\n✅ Analysis complete!');
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, fetchAllSources, extractKeywords, categorizeKeywords };
