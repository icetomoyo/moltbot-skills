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

// Hot topics tracking - EXPANDED with more categories
const HOT_TOPICS = {
  "ai": [
    "GPT",
    "Claude",
    "Llama",
    "Gemini",
    "DeepSeek",
    "Grok",
    "Kimi",
    "Qwen",
    "Mistral",
    "Phi"
  ],
  "robotics": [
    "robotics",
    "Figure",
    "Optimus",
    "Atlas",
    "Spot",
    "Digit",
    "Unitree",
    "humanoid",
    "bipedal"
  ],
  "agents": [
    "agents",
    "multi-agent",
    "agentic",
    "Agent",
    "AutoGPT",
    "Devin",
    "Cursor",
    "Copilot",
    "Computer Use"
  ],
  "vla": [
    "contact",
    "action",
    "VLA",
    "OpenVLA",
    "RT-2",
    "Diffusion Policy",
    "ACT",
    "Aloha"
  ],
  "worldModels": [
    "JEPA",
    "Sora",
    "Dreamer",
    "World Model"
  ],
  "multimodal": [
    "Multimodal",
    "VLM",
    "Image Generation",
    "Video Generation"
  ],
  "infra": [
    "exploration",
    "Training",
    "Inference",
    "LoRA",
    "Quantization",
    "RAG",
    "MoE"
  ],
  "safety": [
    "Safety",
    "Alignment",
    "RLHF",
    "Interpretability"
  ],
  "opensource": [
    "github.com",
    "Open Source",
    "HuggingFace",
    "GitHub",
    "Llama.cpp"
  ],
  "apps": [
    "Coding",
    "Medical",
    "Legal",
    "Finance",
    "Education"
  ]
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
  },
  github: {
    name: 'GitHub',
    emoji: '🐙',
    enabled: true,
    fetch: fetchGitHub
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
  let score = 5;
  const text = (entry.title + ' ' + entry.abstract).toLowerCase();
  
  for (const [category, topics] of Object.entries(HOT_TOPICS)) {
    for (const topic of topics) {
      if (text.includes(topic.toLowerCase())) {
        score += 1.5;
      }
    }
  }
  return score; // No cap, allow scores above 10
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
        score: (p.numLikes || 0) / 50 + 3, // No cap, allow scores above 10
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

// Fetch from Reddit with Nitter fallback
async function fetchReddit() {
  console.log('  👽 Fetching Reddit...');
  const subreddits = ['MachineLearning', 'LocalLLaMA', 'ArtificialIntelligence', 'robotics', 'singularity', 'ChatGPT'];
  const results = [];
  let rateLimited = false;
  
  for (const sub of subreddits) {
    if (rateLimited) break;
    
    try {
      const axios = require('axios');
      const url = `https://www.reddit.com/r/${sub}/hot.json?limit=10`;
      
      const response = await axios.get(url, { 
        timeout: 10000,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      const posts = response.data?.data?.children || [];
      
      for (const post of posts) {
        const data = post.data;
        
        // Filter by score and age (max 7 days old)
        const postDate = new Date(data.created_utc * 1000);
        const daysOld = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (data.score > 5 && daysOld <= 7) {
          results.push({
            title: data.title,
            url: `https://reddit.com${data.permalink}`,
            author: `u/${data.author}`,
            score: data.score / 100 + 5, // Reduced weight: 100 upvotes = 6 points, base 5
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
      if (e.response?.status === 429 || e.message.includes('429')) {
        console.error(`    ⚠️  Reddit rate limited (429)`);
        rateLimited = true;
        break;
      } else {
        console.error(`    ❌ Reddit r/${sub} failed:`, e.message);
      }
    }
  }
  
  if (rateLimited || results.length < 3) {
    console.log('  🔄 Trying Nitter fallback...');
    try {
      const nitterResults = await fetchNitter();
      results.push(...nitterResults);
    } catch (e) {
      console.error('    ❌ Nitter fallback failed:', e.message);
    }
  }
  
  console.log(`   ✅ ${results.length} 条`);
  return results;
}

// Fetch from Hacker News API with dynamic queries
async function fetchHackerNews() {
  console.log('  🟠 Fetching HackerNews...');
  try {
    const axios = require('axios');
    
    const queryGroups = [
      ['GPT-5', 'GPT-5 release', 'OpenAI GPT'],
      ['Claude 4', 'Claude 3.7', 'Anthropic'],
      ['DeepSeek', 'DeepSeek-R1', 'DeepSeek-V4'],
      ['Gemini 2.5', 'Gemini Ultra', 'Google AI'],
      ['Llama 4', 'Llama 3.3', 'Meta AI'],
      ['AI agent', 'AutoGPT', 'Devin AI'],
      ['Cursor AI', 'GitHub Copilot', 'coding assistant'],
      ['humanoid robot', 'Figure AI', 'Tesla Optimus'],
      ['OpenVLA', 'VLA model', 'RT-2'],
      ['world model', 'JEPA', 'Sora']
    ];
    
    const results = [];
    const seenUrls = new Set();
    const shuffled = queryGroups.sort(() => 0.5 - Math.random()).slice(0, 8);
    
    for (const queryGroup of shuffled) {
      for (const query of queryGroup) {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>25&hitsPerPage=3`;
        
        try {
          const response = await axios.get(url, { timeout: 8000 });
          const hits = response.data?.hits || [];
          
          for (const hit of hits) {
            const hitUrl = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
            if (seenUrls.has(hitUrl)) continue;
            seenUrls.add(hitUrl);
            
            const hitDate = new Date(hit.created_at);
            const daysOld = (Date.now() - hitDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysOld > 7) continue;
            
            results.push({
              title: hit.title,
              url: hitUrl,
              author: hit.author,
              score: hit.points / 80 + 4, // Reduced weight: 640 points = 12 points, base 4
              hotTopics: detectHotTopics(hit.title + ' ' + (hit.story_text || '')),
              timestamp: hit.created_at,
              platform: 'HackerNews',
              points: hit.points,
              comments: hit.num_comments
            });
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    console.log(`   ✅ ${results.length} 条`);
    return results.slice(0, 20);
  } catch (e) {
    console.error('    ❌ HackerNews failed:', e.message);
    return [];
  }
}

// Fetch from Nitter
async function fetchNitter() {
  console.log('  🐦 Fetching Nitter...');
  
  const searchTerms = [
    'GPT-5 OR Claude-4 OR DeepSeek',
    'OpenVLA OR VLA OR RT-2',
    'world model OR JEPA OR Sora',
    'Figure AI OR Tesla Optimus OR humanoid',
    'AI agent OR AutoGPT OR Devin'
  ];
  
  const results = [];
  
  for (const term of searchTerms.slice(0, 3)) {
    try {
      const searchUrl = `https://nitter.net/search?f=tweets&q=${encodeURIComponent(term)}`;
      
      const browserOutput = execSync(
        `agent-browser open "${searchUrl}" --format text 2>/dev/null || echo "FAILED"`,
        { encoding: 'utf8', timeout: 15000 }
      );
      
      if (!browserOutput.includes('FAILED') && browserOutput.length > 100) {
        const lines = browserOutput.split('\n').filter(l => l.includes('@') && l.length > 50);
        for (const line of lines.slice(0, 5)) {
          results.push({
            title: line.substring(0, 200),
            url: 'https://nitter.net/search',
            author: 'Nitter',
            score: 5,
            hotTopics: detectHotTopics(line),
            timestamp: new Date().toISOString(),
            platform: 'Nitter'
          });
        }
      }
    } catch (e) {
      // Continue
    }
  }
  
  console.log(`   ✅ ${results.length} 条`);
  return results.slice(0, 15);
}

// Fetch from GitHub API
async function fetchGitHub() {
  console.log('  🐙 Fetching GitHub...');
  try {
    const axios = require('axios');
    
    // Search for trending AI repos created/updated in last 7 days
    const queries = [
      'AI OR LLM OR "machine learning" OR "deep learning" OR "neural network"',
      'agent OR agents OR "AI agent" OR "multi-agent"',
      'robotics OR "humanoid robot" OR VLA OR "vision language"',
      'transformer OR GPT OR LLaMA OR "large language model"'
    ];
    
    const results = [];
    const seenRepos = new Set();
    
    for (const query of queries) {
      try {
        // Search repositories
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+created:>${getDateWeekAgo()}&sort=stars&order=desc&per_page=5`;
        
        const response = await axios.get(url, { 
          timeout: 10000,
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AI-Trend-Monitor'
          }
        });
        
        const repos = response.data?.items || [];
        
        for (const repo of repos) {
          if (seenRepos.has(repo.id)) continue;
          seenRepos.add(repo.id);
          
          // Calculate score based on stars and recent activity
          const stars = repo.stargazers_count || 0;
          const forks = repo.forks_count || 0;
          const score = Math.min(stars / 100 + forks / 50 + 5, 20); // Cap at 20 for now
          
          results.push({
            title: `${repo.full_name}: ${repo.description || 'No description'}`,
            url: repo.html_url,
            author: repo.owner.login,
            score: score,
            hotTopics: detectHotTopics(repo.name + ' ' + (repo.description || '') + ' ' + (repo.topics?.join(' ') || '')),
            timestamp: repo.created_at || new Date().toISOString(),
            platform: 'GitHub',
            stars: stars,
            forks: forks,
            language: repo.language
          });
        }
      } catch (e) {
        // Continue with next query
      }
    }
    
    console.log(`   ✅ ${results.length} 条`);
    return results.slice(0, 15);
  } catch (e) {
    console.error('    ❌ GitHub failed:', e.message);
    return [];
  }
}

function getDateWeekAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
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
  const byPlatform = {};
  allItems.forEach(item => {
    const p = item.platform;
    if (!byPlatform[p]) byPlatform[p] = [];
    byPlatform[p].push(item);
  });
  
  for (const p of Object.keys(byPlatform)) {
    byPlatform[p].sort((a, b) => b.score - a.score);
  }
  
  // Rank individual items by score, not grouped by topic
  const rankedItems = allItems
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  
  return { byPlatform, rankedItems };
}

// Generate WhatsApp summary - Show individual items instead of grouped topics
function generateWhatsAppSummary(data) {
  const { byPlatform, rankedItems } = data;
  
  let msg = `🔥 AI热点监控 ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}\n`;
  
  const platformSummary = Object.entries(byPlatform)
    .map(([p, items]) => `${PLATFORMS[p.toLowerCase()]?.emoji || '•'}${items.length}`)
    .join(' | ');
  msg += `📊 数据源: ${platformSummary}\n\n`;
  
  // TOP 10 individual items with full details
  const topItems = rankedItems.slice(0, 10);
  if (topItems.length > 0) {
    msg += `🏆 TOP ${topItems.length} 热点内容\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    topItems.forEach((item, i) => {
      const fire = '🔥'.repeat(Math.min(Math.ceil(item.score / 3), 3)) || '⭐';
      const platform = PLATFORMS[item.platform.toLowerCase()]?.emoji || '•';
      
      msg += `\n${i + 1}️⃣ ${fire} [${item.platform}]\n`;
      msg += `🔥 热度: ${item.score.toFixed(1)}\n`;
      
      // Title
      const displayTitle = item.title.length > 100 
        ? item.title.substring(0, 100) + '...' 
        : item.title;
      msg += `📌 ${displayTitle}\n`;
      
      // Description/Context
      let description = '';
      if (item.platform === 'Reddit') {
        description = `👍 ${item.upvotes} upvotes | 💬 ${item.comments} comments | r/${item.subreddit}`;
      } else if (item.platform === 'HackerNews') {
        description = `👍 ${item.points} points | 💬 ${item.comments} comments`;
      } else if (item.platform === 'HuggingFace') {
        description = `❤️ ${item.likes} likes`;
      } else if (item.platform === 'arXiv') {
        description = `👤 ${item.author}`;
      } else if (item.platform === 'GitHub') {
        description = `⭐ ${item.stars} stars | 🍴 ${item.forks} forks${item.language ? ' | 📝 ' + item.language : ''}`;
      }
      
      if (description) {
        msg += `📊 ${description}\n`;
      }
      
      // Hot topics detected
      if (item.hotTopics && item.hotTopics.length > 0) {
        const topics = item.hotTopics.slice(0, 3).map(h => h.topic).join(', ');
        msg += `🏷️ ${topics}\n`;
      }
      
      // URL
      if (item.url) {
        msg += `🔗 ${item.url}\n`;
      }
    });
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  }
  
  // Quick summary of hot topics
  const allTopics = {};
  rankedItems.forEach(item => {
    if (item.hotTopics) {
      item.hotTopics.forEach(h => {
        allTopics[h.topic] = (allTopics[h.topic] || 0) + 1;
      });
    }
  });
  
  const sortedTopics = Object.entries(allTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  if (sortedTopics.length > 0) {
    msg += `📌 热门关键词:\n`;
    sortedTopics.forEach(([topic, count], i) => {
      msg += `   ${topic}(${count}) `;
      if ((i + 1) % 4 === 0) msg += '\n';
    });
    msg += `\n\n`;
  }
  
  msg += `⏰ 更新时间: ${new Date().toLocaleString('zh-CN')}`;
  
  return msg;
}

// Save outputs
function saveOutputs(data, whatsappMsg) {
  const timestamp = getTimestamp();
  
  const jsonPath = path.join(OUTPUT_DIR, `trends-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  
  const msgPath = path.join(OUTPUT_DIR, `whatsapp-${timestamp}.txt`);
  fs.writeFileSync(msgPath, whatsappMsg, 'utf8');
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'latest-whatsapp.txt'), whatsappMsg, 'utf8');
  
  return { jsonPath, msgPath };
}

// Main function
async function main() {
  console.log('🔥 AI Trend Monitor\n');
  console.log(`⏰ ${new Date().toLocaleString('zh-CN')}\n`);
  
  console.log('📱 开始监控各平台...\n');
  
  const allItems = [];
  
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
  
  console.log('\n🔄 分析热点话题...');
  const data = aggregateItems(allItems);
  
  console.log('📝 生成报告...');
  const whatsappMsg = generateWhatsAppSummary(data);
  
  const paths = saveOutputs(data, whatsappMsg);
  console.log(`\n💾 已保存:`);
  console.log(`   JSON: ${path.basename(paths.jsonPath)}`);
  console.log(`   WhatsApp: ${path.basename(paths.msgPath)}`);
  
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
