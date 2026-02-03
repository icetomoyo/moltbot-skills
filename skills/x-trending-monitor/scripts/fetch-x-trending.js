#!/usr/bin/env node
/**
 * X Trending Monitor - Real Implementation
 * Fetches trending tweets from X.com using browser automation
 * 
 * NOTE: This script requires:
 * 1. Chrome browser with X/Twitter login
 * 2. OpenClaw browser relay extension enabled
 * 3. Manual captcha solving if triggered
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

// Search queries for X.com
const SEARCH_QUERIES = [
  {
    category: 'AI/LLM',
    query: 'AI OR LLM OR "artificial intelligence" OR "machine learning"',
    minLikes: 100
  },
  {
    category: 'Robotics',
    query: 'robotics OR humanoid OR Figure OR Optimus OR "Tesla Bot"',
    minLikes: 50
  },
  {
    category: 'VLA',
    query: 'VLA OR "vision language action" OR OpenVLA OR RT-2',
    minLikes: 30
  },
  {
    category: 'World Model',
    query: '"world model" OR JEPA OR Sora',
    minLikes: 30
  }
];

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function getDateString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Fetch tweets from X.com using agent-browser
 * This requires Chrome browser with X login
 */
async function fetchTweetsFromX() {
  console.log('🔍 Attempting to fetch real data from X.com...\n');
  console.log('⚠️  IMPORTANT: This requires:');
  console.log('   1. Chrome browser with X/Twitter logged in');
  console.log('   2. OpenClaw browser relay extension attached');
  console.log('   3. May require manual captcha solving\n');
  
  const allTweets = [];
  
  for (const search of SEARCH_QUERIES) {
    try {
      console.log(`📱 Searching: ${search.category}`);
      const encodedQuery = encodeURIComponent(`${search.query} min_faves:${search.minLikes} lang:en`);
      const url = `https://x.com/search?q=${encodedQuery}&f=live`;
      
      // Use agent-browser to open and extract
      console.log(`   Opening: ${url.substring(0, 80)}...`);
      
      // Note: This requires browser relay to be active
      // The actual browser call would be done through OpenClaw agent
      // Here we just document what should happen
      
      console.log(`   ⚠️  Browser automation requires active Chrome relay`);
      console.log(`      Manual step: Visit ${url}`);
      console.log(`      Then extract tweets from the page\n`);
      
    } catch (e) {
      console.error(`   ❌ Error: ${e.message}\n`);
    }
  }
  
  return allTweets;
}

/**
 * Parse browser snapshot output to extract tweets
 * This is a placeholder - actual implementation depends on X.com HTML structure
 */
function parseTweetsFromSnapshot(snapshotHtml) {
  // X.com's HTML structure changes frequently
  // This is a basic parser that may need updating
  
  const tweets = [];
  
  // Look for tweet patterns in HTML
  // Note: This is fragile and depends on X.com's current HTML structure
  const tweetMatches = snapshotHtml.match(/data-testid="tweet"[\s\S]*?data-testid="tweet"/g) || [];
  
  for (const tweetHtml of tweetMatches.slice(0, 10)) {
    try {
      const authorMatch = tweetHtml.match(/href="\/([^"]+)"/);
      const author = authorMatch ? `@${authorMatch[1]}` : '@unknown';
      
      const contentMatch = tweetHtml.match(/lang="en">([^<]+)</);
      const content = contentMatch ? contentMatch[1].trim() : '';
      
      if (content.length > 20) {
        tweets.push({
          author,
          content,
          likes: 0, // Would need to parse actual numbers
          retweets: 0,
          replies: 0,
          timestamp: new Date().toISOString(),
          url: `https://x.com${authorMatch ? '/' + authorMatch[1] : ''}`,
          category: 'Unknown'
        });
      }
    } catch (e) {
      // Skip malformed entries
    }
  }
  
  return tweets;
}

/**
 * Calculate engagement score
 */
function calculateEngagement(tweet) {
  const total = (tweet.likes || 0) + (tweet.retweets || 0) * 2 + (tweet.replies || 0);
  let score = 1;
  if (total > 10000) score = 10;
  else if (total > 5000) score = 9;
  else if (total > 2000) score = 8;
  else if (total > 1000) score = 7;
  else if (total > 500) score = 6;
  else if (total > 200) score = 5;
  else if (total > 100) score = 4;
  else if (total > 50) score = 3;
  else if (total > 20) score = 2;
  return score;
}

/**
 * Detect hot topics in text
 */
function detectHotTopics(text) {
  const topics = [];
  const hotKeywords = [
    'GPT-4', 'GPT-5', 'Claude', 'Gemini', 'DeepSeek', 'Llama', 'Grok',
    'OpenAI', 'Anthropic', 'Google AI', 'Meta AI',
    'Figure', 'Optimus', 'Tesla Bot', 'humanoid', 'robotics',
    'VLA', 'OpenVLA', 'RT-2', 'vision language',
    'world model', 'JEPA', 'Sora',
    'AGI', 'breakthrough', 'released', 'announced'
  ];
  
  const lowerText = text.toLowerCase();
  for (const keyword of hotKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      topics.push(keyword);
    }
  }
  
  return topics;
}

/**
 * Generate WhatsApp summary
 */
function generateWhatsAppSummary(tweets) {
  if (!tweets || tweets.length === 0) {
    return `🔥 X Trending Monitor\n⏰ ${new Date().toLocaleString('zh-CN')}\n\n⚠️ 未能获取到 X.com 数据\n\n可能原因:\n• X.com 需要登录\n• 触发反爬虫机制\n• 网络连接问题`;
  }
  
  // Sort by engagement
  const sorted = [...tweets].sort((a, b) => calculateEngagement(b) - calculateEngagement(a));
  const topTweets = sorted.slice(0, 5);
  
  let msg = `🔥 X Trending Monitor\n`;
  msg += `⏰ ${new Date().toLocaleString('zh-CN')}\n\n`;
  msg += `📊 获取到 ${tweets.length} 条推文\n\n`;
  msg += `🏆 TOP ${topTweets.length} 热门\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  topTweets.forEach((t, i) => {
    const score = calculateEngagement(t);
    const fire = '🔥'.repeat(Math.ceil(score / 3)) || '⭐';
    
    msg += `${i + 1}️⃣ ${fire} ${t.author}\n`;
    
    const content = t.content.length > 100 
      ? t.content.substring(0, 100) + '...' 
      : t.content;
    msg += `💬 ${content}\n`;
    
    if (t.likes || t.retweets) {
      msg += `📊 ❤️${t.likes || 0} 🔄${t.retweets || 0}\n`;
    }
    
    const topics = detectHotTopics(t.content);
    if (topics.length > 0) {
      msg += `🏷️ ${topics.slice(0, 3).join(', ')}\n`;
    }
    
    if (t.url) {
      msg += `🔗 ${t.url}\n`;
    }
    
    msg += '\n';
  });
  
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `⚠️ 注意: X.com 数据抓取需要登录，可能存在延迟`;
  
  return msg;
}

/**
 * Save outputs
 */
function saveOutputs(tweets) {
  const timestamp = getTimestamp();
  
  // Save JSON
  const jsonPath = path.join(OUTPUT_DIR, `tweets-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(tweets, null, 2), 'utf8');
  
  // Save WhatsApp summary
  const whatsappMsg = generateWhatsAppSummary(tweets);
  const whatsappPath = path.join(OUTPUT_DIR, `whatsapp-${timestamp}.txt`);
  fs.writeFileSync(whatsappPath, whatsappMsg, 'utf8');
  
  // Save as latest
  fs.writeFileSync(path.join(OUTPUT_DIR, 'latest-whatsapp.txt'), whatsappMsg, 'utf8');
  
  return { jsonPath, whatsappPath, whatsappMsg };
}

/**
 * Main function
 */
async function main() {
  console.log('🔥 X Trending Monitor\n');
  console.log('⚠️  重要提示: 当前版本需要手动配合浏览器使用');
  console.log('   X.com 的反爬虫机制阻止了全自动抓取\n');
  
  console.log('📋 使用说明:\n');
  console.log('1. 在 Chrome 中登录 X.com');
  console.log('2. 运行以下搜索查询:\n');
  
  SEARCH_QUERIES.forEach((q, i) => {
    const encoded = encodeURIComponent(`${q.query} min_faves:${q.minLikes} lang:en`);
    console.log(`   ${i + 1}. ${q.category}:`);
    console.log(`      https://x.com/search?q=${encoded}&f=live\n`);
  });
  
  console.log('3. 复制感兴趣的推文内容到本地文件');
  console.log('4. 或者使用 browser 工具 snapshot 页面后手动解析\n');
  
  console.log('⚠️  由于 X.com 的限制，此技能目前无法自动运行');
  console.log('   建议改用: ai-trend-monitor (聚合 arXiv, Reddit, HN 等)\n');
  
  // Create empty output to indicate status
  const emptyResult = [];
  const paths = saveOutputs(emptyResult);
  
  console.log('📱 输出消息:');
  console.log('---WHATSAPP_MESSAGE_START---');
  console.log(paths.whatsappMsg);
  console.log('---WHATSAPP_MESSAGE_END---');
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, SEARCH_QUERIES, generateWhatsAppSummary };
