#!/usr/bin/env node
/**
 * X Trending Monitor
 * Fetches trending AI/Robotics/VLA/World Model tweets from X.com
 */

const fs = require('fs');
const path = require('path');

const SKILL_DIR = __dirname;
const WORKSPACE = process.env.WORKSPACE || '/Users/icetomoyo/clawd';
const OUTPUT_DIR = path.join(SKILL_DIR, '..', 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Search queries for different topics
const SEARCH_QUERIES = {
  'AI/LLM': {
    q: '(GPT-5 OR Claude-4 OR Gemini-2.5 OR DeepSeek OR Llama-4 OR "AI breakthrough" OR "LLM" OR "large language model") min_faves:100 lang:en',
    keywords: ['GPT-5', 'Claude 4', 'Gemini 2.5', 'DeepSeek', 'Llama 4', 'Grok 3', 'Kimi', 'Qwen 3', 'LLM', 'AI breakthrough']
  },
  'Robotics': {
    q: '(Figure-02 OR Figure-03 OR Optimus OR "Tesla Bot" OR "Unitree G1" OR "humanoid robot" OR robotics) min_faves:50 lang:en',
    keywords: ['Figure 02', 'Figure 03', 'Optimus', 'Tesla Bot', 'Unitree', 'humanoid', 'robotics', 'Boston Dynamics']
  },
  'VLA': {
    q: '(VLA OR "vision language action" OR OpenVLA OR "pi-zero" OR "π0" OR "RT-2" OR "RT-X") min_faves:30 lang:en',
    keywords: ['VLA', 'OpenVLA', 'π0', 'pi-zero', 'RT-2', 'RT-X', 'vision language action', 'Octo', 'Diffusion Policy']
  },
  'World Model': {
    q: '("world model" OR "world models" OR JEPA OR "Sora Turbo" OR DreamerV3 OR UniWorld) min_faves:30 lang:en',
    keywords: ['world model', 'JEPA', 'Sora Turbo', 'DreamerV3', 'UniWorld', 'GAIA-1']
  }
};

// Hot topics tracking
const HOT_TOPICS = {
  models: ['GPT-5', 'Claude 4', 'Gemini 2.5', 'DeepSeek-V3.2', 'DeepSeek-V4', 'Llama 4', 'Grok 3', 'Kimi k1.5', 'Qwen 3'],
  companies: ['OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'Meta', 'xAI', 'Moonshot', 'Alibaba'],
  robotics: ['Figure AI', 'Figure 02', 'Figure 03', 'Tesla Optimus', 'Unitree', 'Boston Dynamics', 'Agility Robotics'],
  vla: ['OpenVLA', 'π0', 'RT-2', 'RT-X', 'Octo', 'Diffusion Policy', 'ACT', 'Aloha'],
  worldModels: ['JEPA', 'Sora', 'Sora Turbo', 'DreamerV3', 'UniWorld', 'World Models']
};

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function getDateString() {
  return new Date().toISOString().split('T')[0];
}

function calculateEngagementScore(tweet) {
  const likes = tweet.likes || 0;
  const retweets = tweet.retweets || 0;
  const replies = tweet.replies || 0;
  const quotes = tweet.quotes || 0;
  
  // Weighted scoring
  const score = (likes * 1) + (retweets * 2) + (replies * 1.5) + (quotes * 1.5);
  
  // Normalize to 0-10 scale
  let normalized = 0;
  if (score > 10000) normalized = 10;
  else if (score > 5000) normalized = 9;
  else if (score > 2000) normalized = 8;
  else if (score > 1000) normalized = 7;
  else if (score > 500) normalized = 6;
  else if (score > 200) normalized = 5;
  else if (score > 100) normalized = 4;
  else if (score > 50) normalized = 3;
  else if (score > 20) normalized = 2;
  else normalized = 1;
  
  return { raw: score, normalized, level: getHeatLevel(normalized) };
}

function getHeatLevel(score) {
  if (score >= 9) return '🔥🔥🔥 VIRAL';
  if (score >= 7) return '🔥🔥 HOT';
  if (score >= 5) return '🔥 TRENDING';
  if (score >= 3) return '⭐ WARM';
  return '💤 LOW';
}

function detectHotTopics(text) {
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

function generateSearchUrls() {
  const urls = [];
  for (const [category, config] of Object.entries(SEARCH_QUERIES)) {
    const encodedQ = encodeURIComponent(config.q);
    // X.com search with live filter
    const url = `https://x.com/search?q=${encodedQ}&f=live`;
    urls.push({ category, url, keywords: config.keywords });
  }
  return urls;
}

function generateMockTweets() {
  // For testing - generate sample tweets
  return [
    {
      id: '1',
      author: '@ylecun',
      authorName: 'Yann LeCun',
      content: 'JEPA is the future of AI. World Models will revolutionize how machines understand the physical world. We need to move beyond LLMs toward systems that can actually reason about the world.',
      likes: 3420,
      retweets: 892,
      replies: 456,
      quotes: 234,
      timestamp: new Date().toISOString(),
      url: 'https://x.com/ylecun/status/1234567890',
      category: 'World Model'
    },
    {
      id: '2',
      author: '@DrJimFan',
      authorName: 'Jim Fan',
      content: 'OpenVLA is finally here! The first open-source VLA model that can control real robots. This is a huge step for embodied AI. π0 and Octo showed the way, now we have an open alternative.',
      likes: 5234,
      retweets: 1245,
      replies: 678,
      quotes: 456,
      timestamp: new Date().toISOString(),
      url: 'https://x.com/DrJimFan/status/1234567891',
      category: 'VLA'
    },
    {
      id: '3',
      author: '@karpathy',
      authorName: 'Andrej Karpathy',
      content: 'GPT-5 speculation is interesting but let\'s not forget that the real breakthrough will come from systems that can actually interact with the world. VLA models are the bridge between language and action.',
      likes: 8934,
      retweets: 2134,
      replies: 1234,
      quotes: 789,
      timestamp: new Date().toISOString(),
      url: 'https://x.com/karpathy/status/1234567892',
      category: 'AI/LLM'
    }
  ];
}

function analyzeTweets(tweets) {
  // Calculate engagement scores
  const scored = tweets.map(t => {
    const engagement = calculateEngagementScore(t);
    const hotTopics = detectHotTopics(t.content);
    return { ...t, engagement, hotTopics };
  });
  
  // Sort by engagement score
  scored.sort((a, b) => b.engagement.normalized - a.engagement.normalized);
  
  // Count by category
  const byCategory = {};
  tweets.forEach(t => {
    const cat = t.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });
  
  // Count hot topics
  const topicCounts = {};
  scored.forEach(t => {
    t.hotTopics.forEach(({ topic }) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });
  
  return { scored, byCategory, topicCounts };
}

function generateWhatsAppSummary(analysis) {
  const { scored, byCategory, topicCounts } = analysis;
  const topTweets = scored.slice(0, 5);
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  let msg = `🔥 X Trending - AI/Robotics/VLA/World Model\n`;
  msg += `⏰ ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  // Category breakdown
  msg += `📊 监控领域分布:\n`;
  for (const [cat, count] of Object.entries(byCategory)) {
    msg += `   ${cat}: ${count} 条\n`;
  }
  msg += `\n`;
  
  // Top tweets
  msg += `🏆 最热推文 TOP ${topTweets.length}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  
  topTweets.forEach((t, i) => {
    const heat = '🔥'.repeat(Math.ceil(t.engagement.normalized / 3));
    msg += `${i + 1}️⃣ ${t.authorName} ${t.author}\n`;
    msg += `   ${heat} 热度: ${t.engagement.normalized}/10 (${t.engagement.level.replace(/🔥/g, '').trim()})\n`;
    msg += `   ❤️ ${t.likes}  🔄 ${t.retweets}  💬 ${t.replies}\n`;
    
    // Content summary (truncated)
    const summary = t.content.substring(0, 80) + (t.content.length > 80 ? '...' : '');
    msg += `   💬 ${summary}\n`;
    
    if (t.hotTopics.length > 0) {
      msg += `   🏷️ ${t.hotTopics.map(h => h.topic).slice(0, 3).join(', ')}\n`;
    }
    
    msg += `   🔗 ${t.url}\n\n`;
  });
  
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Hot topics
  if (topTopics.length > 0) {
    msg += `📈 热门话题 TOP 8:\n`;
    topTopics.forEach(([topic, count], i) => {
      msg += `   ${i + 1}. ${topic} (${count} 次提及)\n`;
    });
    msg += `\n`;
  }
  
  // Timestamp
  msg += `📄 完整报告: skills/x-trending-monitor/output/\n`;
  msg += `⏱️ 下次监控: 2-4 小时后`;
  
  return msg;
}

function generateFullReport(analysis) {
  const { scored, byCategory, topicCounts } = analysis;
  const timestamp = getTimestamp();
  
  let md = `# X Trending Monitor Report\n\n`;
  md += `**Time**: ${new Date().toLocaleString('zh-CN')}\n`;
  md += `**Total Tweets**: ${scored.length}\n\n`;
  
  // Category breakdown
  md += `## 📊 Category Distribution\n\n`;
  for (const [cat, count] of Object.entries(byCategory)) {
    md += `- **${cat}**: ${count} tweets\n`;
  }
  md += `\n`;
  
  // Hot topics
  md += `## 🔥 Hot Topics\n\n`;
  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
  sortedTopics.forEach(([topic, count]) => {
    md += `- ${topic}: ${count} mentions\n`;
  });
  md += `\n`;
  
  // All tweets
  md += `## 📝 All Tweets\n\n`;
  scored.forEach((t, i) => {
    md += `### ${i + 1}. ${t.authorName} (${t.author})\n\n`;
    md += `- **Heat Score**: ${t.engagement.normalized}/10\n`;
    md += `- **Engagement**: ❤️ ${t.likes} | 🔄 ${t.retweets} | 💬 ${t.replies} | 🔗 ${t.quotes}\n`;
    md += `- **Category**: ${t.category || 'Other'}\n`;
    if (t.hotTopics.length > 0) {
      md += `- **Hot Topics**: ${t.hotTopics.map(h => h.topic).join(', ')}\n`;
    }
    md += `- **Time**: ${new Date(t.timestamp).toLocaleString()}\n`;
    md += `- **URL**: ${t.url}\n\n`;
    md += `**Content**:\n\n${t.content}\n\n`;
    md += `---\n\n`;
  });
  
  return md;
}

function saveOutputs(analysis) {
  const timestamp = getTimestamp();
  
  // Save JSON
  const jsonPath = path.join(OUTPUT_DIR, `tweets-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(analysis.scored, null, 2), 'utf8');
  
  // Save Markdown report
  const mdPath = path.join(OUTPUT_DIR, `summary-${timestamp}.md`);
  fs.writeFileSync(mdPath, generateFullReport(analysis), 'utf8');
  
  // Save WhatsApp summary
  const whatsappPath = path.join(OUTPUT_DIR, `whatsapp-${timestamp}.txt`);
  fs.writeFileSync(whatsappPath, generateWhatsAppSummary(analysis), 'utf8');
  
  // Also save as latest for easy access
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'latest-whatsapp.txt'),
    generateWhatsAppSummary(analysis),
    'utf8'
  );
  
  return { jsonPath, mdPath, whatsappPath };
}

async function main() {
  console.log('🔥 X Trending Monitor\n');
  console.log('⏰', new Date().toLocaleString('zh-CN'));
  console.log('');
  
  // For now, use mock data
  // In production, this would use browser automation to fetch from X.com
  console.log('📱 Generating search URLs:');
  const urls = generateSearchUrls();
  urls.forEach(({ category, url }) => {
    console.log(`  ${category}: ${url.substring(0, 80)}...`);
  });
  
  console.log('\n⚠️  Note: Browser automation required to fetch from X.com');
  console.log('   Manual access needed due to X.com authentication\n');
  
  // Generate mock data for demonstration
  console.log('📝 Using sample data for demonstration...\n');
  const tweets = generateMockTweets();
  
  console.log(`📊 Analyzing ${tweets.length} tweets...`);
  const analysis = analyzeTweets(tweets);
  
  console.log('\n📈 Analysis complete:');
  console.log(`   Total tweets: ${analysis.scored.length}`);
  console.log(`   Categories: ${Object.keys(analysis.byCategory).join(', ')}`);
  console.log(`   Hot topics: ${Object.keys(analysis.topicCounts).length}`);
  
  // Save outputs
  console.log('\n💾 Saving outputs...');
  const paths = saveOutputs(analysis);
  console.log(`   JSON: ${path.basename(paths.jsonPath)}`);
  console.log(`   Report: ${path.basename(paths.mdPath)}`);
  console.log(`   WhatsApp: ${path.basename(paths.whatsappPath)}`);
  
  // Output WhatsApp message
  const whatsappMsg = generateWhatsAppSummary(analysis);
  console.log('\n📱 WhatsApp Message:');
  console.log('---WHATSAPP_MESSAGE_START---');
  console.log(whatsappMsg);
  console.log('---WHATSAPP_MESSAGE_END---');
  
  return whatsappMsg;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, generateSearchUrls, analyzeTweets, generateWhatsAppSummary };
