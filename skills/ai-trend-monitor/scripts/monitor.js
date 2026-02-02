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
  ai: ['GPT-5', 'GPT-5o', 'o3', 'o3 mini', 'o1 pro', 'o1', 'Operator',
       'Claude 4', 'Claude 4 Opus', 'Claude 4 Sonnet', 'Claude 3.7', 'Claude Code',
       'Gemini 2.0', 'Gemini 2.5', 'Gemini Flash', 'Gemini Ultra', 'Astra',
       'DeepSeek-V3', 'DeepSeek-V3.2', 'DeepSeek-V4', 'DeepSeek-R1', 'DeepSeek-R2', 'DeepSeek-Coder',
       'Llama 4', 'Llama 4 Scout', 'Llama 4 Maverick', 'Llama 3.3', 'Llama 3.2',
       'Grok 3', 'Grok 3 mini', 'xAI',
       'Kimi k1.5', 'Kimi k1.6', 'Moonshot',
       'Qwen 2.5', 'Qwen 3', 'Qwen 3 MoE', 'Qwq-32B',
       'Command R+', 'Cohere',
       'Phi-4', 'Phi-4 mini',
       'Gemma 2', 'Gemma 3', 'Gemma 27B',
       'Nemotron', 'NVLM', 'Mamba', 'RWKV'],
  
  robotics: ['Figure 02', 'Figure 03', 'Figure AI', 'Helix', 'Figure',
             'Optimus Gen 2', 'Optimus Gen 3', 'Tesla Bot', 'Tesla Optimus',
             'Unitree G1', 'Unitree H1', 'Unitree B2', 'Unitree Go2', 'Unitree',
             'Boston Dynamics Atlas', 'Spot', 'Stretch', 'Digit',
             'Agility Robotics', 'Fourier GR-1', 'Fourier GR-2', 'Fourier',
             'Apptronik Apollo', '1X Neo', '1X Eve', 'Clone Robotics',
             'MenteeBot', 'Astribot S1', 'Beyond Imagination',
             'humanoid', 'humanoid robot', 'bipedal', 'quadruped'],
  
  vla: ['OpenVLA', 'OpenVLA 7B', 'π0', 'pi-zero', 'pi0', 'pi-zero model',
        'RT-2', 'RT-X', 'RT-Trajectory', 'RT-Sketch', 'RT-Play',
        'Octo', 'Octo Model', 'RDT', 'RDT-1B',
        '3D Diffusion Policy', 'Diffusion Policy',
        'ACT', 'Aloha', 'Aloha 2', 'Mobile ALOHA',
        'VLA', 'Vision Language Action', 'vision-language-action',
        'robot learning', 'imitation learning', 'behavior cloning',
        'sim-to-real', 'sim2real', 'teleoperation', 'teleop'],
  
  worldModels: ['JEPA', 'I-JEPA', 'V-JEPA', 'Video JEPA',
                'Sora', 'Sora Turbo', 'OpenAI Sora',
                'DreamerV3', 'Dreamer v3', 'Dreamer',
                'UniWorld', 'GAIA-1', 'World Model', 'world models',
                'physical world model', 'world simulator'],
  
  agents: ['AI Agent', 'AI Agents', 'multi-agent', 'agentic AI',
           'AutoGPT', 'Auto-GPT', 'BabyAGI',
           'Devin', 'Cognition Devin', 'AI software engineer',
           'Cursor', 'Cursor AI', 'Cursor editor',
           'GitHub Copilot', 'Copilot', 'Codeium',
           'Claude Computer Use', 'computer use', 'Operator AI',
           'tool use', 'function calling', 'API calling',
           'browser automation', 'web automation'],
  
  multimodal: ['multimodal', 'multimodal model', 'any-to-any',
               'vision language model', 'VLM', 'image generation',
               'video generation', 'text-to-video', 'text-to-image',
               'Runway', 'Runway Gen-3', 'Pika', 'Pika Labs',
               'Veo', 'Google Veo', 'Luma AI', 'Dream Machine',
               'Midjourney', 'Stable Diffusion', 'SDXL', 'FLUX',
               'DALL-E 3', 'DALL-E', 'Imagen', 'Imagen 3',
               'voice cloning', 'TTS', 'text-to-speech',
               'music generation', 'audio generation'],
  
  infra: ['LLM training', 'model training', 'pre-training',
          'fine-tuning', 'LoRA', 'QLoRA', 'PEFT',
          'quantization', 'GGUF', 'AWQ', 'GPTQ',
          'model distillation', 'knowledge distillation',
          'inference optimization', 'vLLM', 'TensorRT-LLM',
          'model deployment', 'model serving', 'API',
          'GPU cluster', 'H100', 'A100', 'GPU shortage',
          'Mixture of Experts', 'MoE', 'sparse attention',
          'long context', 'context window', '1M context',
          'RAG', 'retrieval augmented', 'vector database',
          'embedding', 'vector search', 'semantic search'],
  
  safety: ['AI safety', 'AI alignment', 'RLHF', 'RLAIF',
           'constitutional AI', 'AI ethics', 'responsible AI',
           'model interpretability', 'mechanistic interpretability',
           'jailbreak', 'prompt injection', 'adversarial attack',
           'model evaluation', 'benchmark', 'leaderboard',
           'MMLU', 'HumanEval', 'GSM8K', 'MATH',
           'hallucination', 'factuality', 'truthfulness'],
  
  opensource: ['open source', 'open-source model', 'open weights',
               'HuggingFace', 'HF', 'HF Transformers',
               'Llama.cpp', 'Ollama', 'LocalAI',
               'GitHub', 'open source release', 'model license',
               'community model', 'fine-tuned model', 'LoRA weights'],
  
  apps: ['coding assistant', 'code generation', 'code completion',
         'AI tutor', 'education AI', 'learning assistant',
         'AI doctor', 'medical AI', 'healthcare AI', 'clinical AI',
         'AI lawyer', 'legal AI', 'contract review',
         'AI finance', 'trading bot', 'quant trading', 'FinGPT',
         'AI customer service', 'chatbot', 'virtual assistant',
         'content generation', 'copywriting AI', 'marketing AI',
         'AI art', 'AI music', 'AI video', 'creative AI']
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
  let score = 5;
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
        if (data.score > 5) {
          results.push({
            title: data.title,
            url: `https://reddit.com${data.permalink}`,
            author: `u/${data.author}`,
            score: Math.min(data.score / 50 + 3, 10),
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
              score: Math.min(hit.points / 40 + 2, 10),
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
  
  const topicGroups = {};
  
  allItems.forEach(item => {
    const keyTopics = item.hotTopics?.map(h => h.topic) || [];
    if (keyTopics.length === 0) return;
    
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
  
  const ranked = Object.values(topicGroups)
    .map(g => ({
      ...g,
      platforms: Array.from(g.platforms),
      itemCount: g.items.length
    }))
    .sort((a, b) => b.combinedScore - a.combinedScore);
  
  return { byPlatform, ranked: ranked.slice(0, 20) };
}

// Generate WhatsApp summary - ENHANCED version
function generateWhatsAppSummary(data) {
  const { byPlatform, ranked } = data;
  
  let msg = `🔥 AI热点监控 ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}\n`;
  
  const platformSummary = Object.entries(byPlatform)
    .map(([p, items]) => `${PLATFORMS[p.toLowerCase()]?.emoji || '•'}${items.length}`)
    .join(' | ');
  msg += `📊 数据源: ${platformSummary}\n\n`;
  
  // TOP 5 with detailed info
  const topTopics = ranked.slice(0, 5);
  if (topTopics.length > 0) {
    msg += `🏆 TOP ${topTopics.length} 热点话题\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    topTopics.forEach((topic, i) => {
      const fire = '🔥'.repeat(Math.min(Math.ceil(topic.combinedScore / 15), 3));
      const platforms = topic.platforms.slice(0, 3).join(', ');
      
      msg += `\n${i + 1}️⃣ 【${topic.topic}】${fire}\n`;
      msg += `   📈 热度: ${topic.combinedScore.toFixed(1)}分 | 📊 ${platforms} | 📝 ${topic.itemCount}条\n`;
      
      // Show top 2 items with full titles
      const sortedItems = topic.items.sort((a, b) => b.score - a.score).slice(0, 2);
      sortedItems.forEach((item, idx) => {
        if (item.title) {
          // Show full title but limit to 80 chars
          const displayTitle = item.title.length > 80 
            ? item.title.substring(0, 80) + '...' 
            : item.title;
          msg += `   💬 ${idx + 1}. ${displayTitle}\n`;
          if (item.url) {
            msg += `   🔗 ${item.url}\n`;
          }
        }
      });
    });
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  }
  
  // Other hot topics
  const otherTopics = ranked.slice(5, 12);
  if (otherTopics.length > 0) {
    msg += `📌 其他关注话题:\n`;
    otherTopics.forEach((t, i) => {
      msg += `   ${i + 6}. ${t.topic} (${t.itemCount}条)\n`;
    });
    msg += `\n`;
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
