#!/usr/bin/env node
/**
 * AI Trend Monitor - Unified monitoring across multiple sources
 * Sources: arXiv, HuggingFace, Reddit, HackerNews, Nitter
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

// Hot topics tracking
const HOT_TOPICS = {
  ai: ['GPT-5', 'GPT-5o', 'o3', 'o3 mini', 'o1 pro', 'Operator',
       'Claude 4', 'Claude 4 Opus', 'Claude 3.7',
       'Gemini 2.0', 'Gemini 2.5', 'Gemini Flash',
       'DeepSeek-V3.2', 'DeepSeek-V4', 'DeepSeek-R2',
       'Llama 4', 'Llama 4 Scout', 'Llama 4 Maverick',
       'Grok 3', 'Grok 3 mini',
       'Kimi k1.5', 'Kimi k1.6',
       'Qwen 2.5', 'Qwen 3', 'Qwq-32B'],
  robotics: ['Figure 02', 'Figure 03', 'Figure AI', 'Helix',
             'Optimus Gen 2', 'Optimus Gen 3', 'Tesla Bot',
             'Unitree G1', 'Unitree H1', 'Unitree B2', 'Unitree Go2',
             'Boston Dynamics Atlas', 'Spot', 'Digit',
             'Agility Robotics', 'Fourier GR-1', 'Fourier GR-2',
             'Apptronik Apollo', '1X Neo', 'Clone Robotics'],
  vla: ['OpenVLA', 'OpenVLA 7B', 'π0', 'pi-zero', 'pi0',
        'RT-2', 'RT-X', 'RT-Trajectory', 'RT-Sketch',
        'Octo', 'RDT', '3D Diffusion Policy',
        'ACT', 'Aloha', 'Aloha 2', 'Mobile ALOHA'],
  worldModels: ['JEPA', 'I-JEPA', 'V-JEPA',
                'Sora', 'Sora Turbo',
                'DreamerV3', 'Dreamer v3', 'UniWorld', 'GAIA-1',
                'world model', 'world models']
};

// Platform configurations
const PLATFORMS = {
  arxiv: {
    name: 'arXiv',
    emoji: '📄',
    enabled: true,
    fetch: fetchArxiv
  },
  huggingface: {
    name: 'HuggingFace',
    emoji: '🤗',
    enabled: true,
    fetch: fetchHuggingFace
  },
  reddit: {
    name: 'Reddit',
    emoji: '👽',
    enabled: true,
    fetch: fetchReddit
  },
  hackernews: {
    name: 'HackerNews',
    emoji: '🟠',
    enabled: true,
    fetch: fetchHackerNews
  },
  nitter: {
    name: 'Nitter',
    emoji: '🐦',
    enabled: true,
    fetch: fetchNitter
  }
};

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function getDateString() {
  return new Date().toISOString().split('T')[0];
}

// Fetch from arXiv API
async function fetchArxiv() {
  console.log('  📄 Fetching arXiv...');
  try {
    const axios = require('axios');
    const query = 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL';
    const url = `http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`;
    
    const response = await axios.get(url, { timeout: 10000 });
    const entries = parseArxivXml(response.data);
    
    return entries.map(e => ({
      title: e.title,
      url: e.id.replace('/abs/', '/pdf/'),
      author: e.authors?.[0] || 'Unknown',
      score: calculateArxivScore(e),
      hotTopics: detectHotTopics(e.title + ' ' + e.abstract),
      timestamp: e.published,
      platform: 'arXiv'
    }));
  } catch (e) {
    console.error('    ❌ arXiv failed:', e.message);
    return [];
  }
}

function parseArxivXml(xml) {
  const entries = [];
  const matches = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/g) || [];
  
  for (const block of matches) {
    const title = (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim() || '';
    const id = (block.match(/<id>([\s\S]*?)<\/id>/) || [])[1]?.trim() || '';
    const summary = (block.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.trim() || '';
    const published = (block.match(/<published>([\s\S]*?)<\/published>/) || [])[1]?.trim() || '';
    
    const authorMatches = block.match(/<author[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g) || [];
    const authors = authorMatches.map(a => a.match(/<name>([\s\S]*?)<\/name>/)?.[1]?.trim()).filter(Boolean);
    
    if (title && id) {
      entries.push({ title, id, abstract: summary, published, authors });
    }
  }
  return entries;
}

function calculateArxivScore(entry) {
  // arXiv papers get base score + hot topic bonus
  let score = 5; // base score for being new
  const text = (entry.title + ' ' + entry.abstract).toLowerCase();
  
  for (const [category, topics] of Object.entries(HOT_TOPICS)) {
    for (const topic of topics) {
      if (text.includes(topic.toLowerCase())) {
        score += 1.5;
      }
    }
  }
  return Math.min(score, 10);
}

// Fetch from HuggingFace API
async function fetchHuggingFace() {
  console.log('  🤗 Fetching HuggingFace...');
  try {
    const axios = require('axios');
    const url = 'https://huggingface.co/api/daily_papers';
    
    const response = await axios.get(url, { timeout: 10000 });
    if (!Array.isArray(response.data)) return [];
    
    return response.data.slice(0, 10).map(p => {
      const paper = p.paper || {};
      return {
        title: paper.title || p.title || 'Unknown',
        url: paper.url || `https://arxiv.org/abs/${paper.id}`,
        author: paper.authors?.[0]?.name || 'Unknown',
        score: Math.min((p.numLikes || 0) / 50 + 3, 10),
        hotTopics: detectHotTopics(paper.title + ' ' + (p.summary || paper.abstract)),
        timestamp: p.publishedAt || new Date().toISOString(),
        platform: 'HuggingFace',
        likes: p.numLikes || 0
      };
    });
  } catch (e) {
    console.error('    ❌ HuggingFace failed:', e.message);
    return [];
  }
}

// Fetch from Reddit JSON API (public)
async function fetchReddit() {
  console.log('  👽 Fetching Reddit...');
  const subreddits = ['MachineLearning', 'LocalLLaMA', 'ArtificialIntelligence', 'robotics'];
  const results = [];
  
  for (const sub of subreddits) {
    try {
      const axios = require('axios');
      const url = `https://www.reddit.com/r/${sub}/hot.json?limit=10`;
      
      const response = await axios.get(url, { 
        timeout: 10000,
        headers: { 'User-Agent': 'AI-Trend-Monitor/1.0' }
      });
      
      const posts = response.data?.data?.children || [];
      
      for (const post of posts) {
        const data = post.data;
        if (data.score > 20) { // Filter low engagement
          results.push({
            title: data.title,
            url: `https://reddit.com${data.permalink}`,
            author: `u/${data.author}`,
            score: Math.min(data.score / 100 + 2, 10),
            hotTopics: detectHotTopics(data.title + ' ' + (data.selftext || '')),
            timestamp: new Date(data.created_utc * 1000).toISOString(),
            platform: 'Reddit',
            upvotes: data.score,
            comments: data.num_comments,
            subreddit: sub
          });
        }
      }
    } catch (e) {
      console.error(`    ❌ Reddit r/${sub} failed:`, e.message);
    }
  }
  
  return results;
}

// Fetch from Hacker News API
async function fetchHackerNews() {
  console.log('  🟠 Fetching HackerNews...');
  try {
    const axios = require('axios');
    const queries = ['AI', 'LLM', 'GPT', 'Claude', 'robotics', 'VLA', 'world model'];
    const results = [];
    
    for (const query of queries) {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>30&hitsPerPage=5`;
      
      const response = await axios.get(url, { timeout: 10000 });
      const hits = response.data?.hits || [];
      
      for (const hit of hits) {
        // Check if not already added
        if (!results.find(r => r.url === hit.url)) {
          results.push({
            title: hit.title,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            author: hit.author,
            score: Math.min(hit.points / 50 + 2, 10),
            hotTopics: detectHotTopics(hit.title + ' ' + (hit.story_text || '')),
            timestamp: hit.created_at,
            platform: 'HackerNews',
            points: hit.points,
            comments: hit.num_comments
          });
        }
      }
    }
    
    return results.slice(0, 15);
  } catch (e) {
    console.error('    ❌ HackerNews failed:', e.message);
    return [];
  }
}

// Fetch from Nitter (X mirror)
async function fetchNitter() {
  console.log('  🐦 Fetching Nitter...');
  
  const instances = [
    'https://nitter.net',
    'https://nitter.privacydev.net',
    'https://nitter.cz'
  ];
  
  const queries = [
    '(GPT-5 OR Claude-4 OR DeepSeek) min_faves:50',
    '(OpenVLA OR VLA OR RT-2) min_faves:30',
    '(world model OR JEPA OR Sora) min_faves:30'
  ];
  
  const results = [];
  
  for (const instance of instances) {
    try {
      for (const query of queries) {
        // Note: Nitter web scraping would require agent-browser
        // For now, return empty or use a placeholder
        // This is where you'd use: agent-browser open "${instance}/search?..."
      }
    } catch (e) {
      // Try next instance
    }
  }
  
  // Placeholder: return mock data for demonstration
  // In production, this would use agent-browser to scrape Nitter
  console.log('    ⚠️  Nitter scraping requires agent-browser (implementing...)');
  return [];
}

// Detect hot topics in text
function detectHotTopics(text) {
  if (!text) return [];
  const matched = [];
  const lowerText = text.toLowerCase();
  
  for (const [category, topics] of Object.entries(HOT_TOPICS)) {
    for (const topic of topics) {
      if (lowerText.includes(topic.toLowerCase())) {
        matched.push({ category, topic });
      }
    }
  }
  
  return matched;
}

// Aggregate and rank all items
function aggregateItems(allItems) {
  // Group by platform
  const byPlatform = {};
  allItems.forEach(item => {
    const p = item.platform;
    if (!byPlatform[p]) byPlatform[p] = [];
    byPlatform[p].push(item);
  });
  
  // Sort each platform by score
  for (const p of Object.keys(byPlatform)) {
    byPlatform[p].sort((a, b) => b.score - a.score);
  }
  
  // Calculate combined scores for similar items
  const topicGroups = {};
  
  allItems.forEach(item => {
    const keyTopics = item.hotTopics?.map(h => h.topic) || [];
    if (keyTopics.length === 0) return;
    
    // Use first hot topic as group key
    const key = keyTopics[0];
    if (!topicGroups[key]) {
      topicGroups[key] = {
        topic: key,
        category: item.hotTopics[0].category,
        items: [],
        combinedScore: 0,
        platforms: new Set()
      };
    }
    
    topicGroups[key].items.push(item);
    topicGroups[key].combinedScore += item.score;
    topicGroups[key].platforms.add(item.platform);
  });
  
  // Convert to array and sort
  const ranked = Object.values(topicGroups)
    .map(g => ({
      ...g,
      platforms: Array.from(g.platforms),
      itemCount: g.items.length
    }))
    .sort((a, b) => b.combinedScore - a.combinedScore);
  
  return { byPlatform, ranked: ranked.slice(0, 20) };
}

// Generate WhatsApp summary
function generateWhatsAppSummary(data) {
  const { byPlatform, ranked } = data;
  
  let msg = `🔥 AI Trend Monitor - ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  // Platform summary
  msg += `📊 数据来源:\n`;
  for (const [platform, items] of Object.entries(byPlatform)) {
    const emoji = PLATFORMS[platform.toLowerCase()]?.emoji || '•';
    msg += `   ${emoji} ${platform}: ${items.length} 条\n`;
  }
  msg += `\n`;
  
  // Top trending topics
  const topTopics = ranked.slice(0, 5);
  if (topTopics.length > 0) {
    msg += `🏆 综合热度 TOP ${topTopics.length}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    topTopics.forEach((topic, i) => {
      const fire = '🔥'.repeat(Math.min(Math.ceil(topic.combinedScore / 10), 3));
      msg += `${i + 1}️⃣ [${topic.topic}]\n`;
      msg += `   ${fire} 综合热度: ${topic.combinedScore.toFixed(1)}/10\n`;
      msg += `   📊 来源: ${topic.platforms.join(', ')} (${topic.itemCount} 条)\n`;
      
      // Show top item from this topic
      const topItem = topic.items.sort((a, b) => b.score - a.score)[0];
      if (topItem) {
        const summary = topItem.title?.substring(0, 60) + (topItem.title?.length > 60 ? '...' : '');
        msg += `   💬 ${summary}\n`;
        msg += `   🔗 ${topItem.url}\n`;
      }
      msg += `\n`;
    });
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  }
  
  // Hot topics list
  const allTopics = ranked.slice(0, 10);
  if (allTopics.length > 0) {
    msg += `📈 热门话题:\n`;
    allTopics.forEach((t, i) => {
      msg += `   ${i + 1}. ${t.topic} (${t.itemCount} 提及)\n`;
    });
  }
  
  return msg;
}

// Save outputs
function saveOutputs(data, whatsappMsg) {
  const timestamp = getTimestamp();
  
  // Save JSON
  const jsonPath = path.join(OUTPUT_DIR, `trends-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  
  // Save WhatsApp message
  const msgPath = path.join(OUTPUT_DIR, `whatsapp-${timestamp}.txt`);
  fs.writeFileSync(msgPath, whatsappMsg, 'utf8');
  
  // Save latest
  fs.writeFileSync(path.join(OUTPUT_DIR, 'latest-whatsapp.txt'), whatsappMsg, 'utf8');
  
  return { jsonPath, msgPath };
}

// Main function
async function main() {
  console.log('🔥 AI Trend Monitor\n');
  console.log(`⏰ ${new Date().toLocaleString('zh-CN')}\n`);
  
  console.log('📱 开始监控各平台...\n');
  
  const allItems = [];
  
  // Fetch from all enabled platforms
  for (const [key, config] of Object.entries(PLATFORMS)) {
    if (config.enabled) {
      console.log(`${config.emoji} ${config.name}:`);
      try {
        const items = await config.fetch();
        console.log(`   ✅ ${items.length} 条`);
        allItems.push(...items);
      } catch (e) {
        console.error(`   ❌ Error:`, e.message);
      }
      console.log('');
    }
  }
  
  console.log(`📊 总计: ${allItems.length} 条内容`);
  
  if (allItems.length === 0) {
    console.log('\n⚠️ 未获取到数据');
    return;
  }
  
  // Aggregate and rank
  console.log('\n🔄 分析热点话题...');
  const data = aggregateItems(allItems);
  
  // Generate summary
  console.log('📝 生成报告...');
  const whatsappMsg = generateWhatsAppSummary(data);
  
  // Save
  const paths = saveOutputs(data, whatsappMsg);
  console.log(`\n💾 已保存:`);
  console.log(`   JSON: ${path.basename(paths.jsonPath)}`);
  console.log(`   WhatsApp: ${path.basename(paths.msgPath)}`);
  
  // Output for WhatsApp
  console.log('\n📱 WhatsApp Message:');
  console.log('---WHATSAPP_MESSAGE_START---');
  console.log(whatsappMsg);
  console.log('---WHATSAPP_MESSAGE_END---');
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, PLATFORMS, HOT_TOPICS };
