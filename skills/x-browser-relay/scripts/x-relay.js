#!/usr/bin/env node
/**
 * X.com Browser Relay 访问器
 * 使用 OpenClaw Browser Relay 查看推荐内容
 * 
 * 用法:
 *   node x-relay.js                    # 查看20条推荐
 *   node x-relay.js --count 30         # 查看30条
 *   node x-relay.js --hot-only         # 只输出热门
 *   node x-relay.js --user elonmusk    # 查看特定用户
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    count: parseInt(args.find((_, i) => args[i-1] === '--count') || args.find((_, i) => args[i-1] === '-c')) || 20,
    hotOnly: args.includes('--hot-only') || args.includes('-h'),
    user: args.find((_, i) => args[i-1] === '--user') || args.find((_, i) => args[i-1] === '-u'),
    minScore: parseInt(args.find((_, i) => args[i-1] === '--min-score') || args.find((_, i) => args[i-1] === '-s')) || 50
  };
}

/**
 * 计算推文热度
 */
function calculateScore(tweet) {
  const retweets = tweet.retweets || 0;
  const likes = tweet.likes || 0;
  const replies = tweet.replies || 0;
  
  // 热度 = 转发×3 + 点赞×1 + 评论×2
  const score = retweets * 3 + likes * 1 + replies * 2;
  
  // 标准化到 0-100
  // 假设: 100转发 + 1000点赞 + 50评论 = 100分
  const maxExpected = 100 * 3 + 1000 * 1 + 50 * 2; // 1400
  const normalized = Math.min(Math.round((score / maxExpected) * 100), 100);
  
  return normalized;
}

/**
 * 获取热度等级
 */
function getHotLevel(score) {
  if (score >= 90) return { emoji: '🔥', level: '爆款', push: true };
  if (score >= 70) return { emoji: '⭐', level: '热门', push: true };
  if (score >= 50) return { emoji: '📈', level: '较热', push: false };
  return { emoji: '📊', level: '普通', push: false };
}

/**
 * 格式化数字
 */
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * 生成浏览器指令
 */
function generateBrowserInstructions(args) {
  const instructions = [];
  
  if (args.user) {
    // 访问特定用户
    instructions.push({
      action: 'navigate',
      url: `https://x.com/${args.user}`,
      description: `访问用户 @${args.user} 的主页`
    });
  } else {
    // 访问推荐流
    instructions.push({
      action: 'navigate',
      url: 'https://x.com/home',
      description: '访问 x.com For You 推荐流'
    });
  }
  
  instructions.push({
    action: 'wait',
    timeMs: 3000,
    description: '等待页面加载'
  });
  
  // 滚动加载更多推文
  const scrollCount = Math.ceil(args.count / 10);
  for (let i = 0; i < scrollCount; i++) {
    instructions.push({
      action: 'scroll',
      direction: 'down',
      amount: 800,
      description: `滚动加载更多推文 (${i + 1}/${scrollCount})`
    });
    instructions.push({
      action: 'wait',
      timeMs: 1000,
      description: '等待推文加载'
    });
  }
  
  instructions.push({
    action: 'snapshot',
    description: '获取推文数据'
  });
  
  return instructions;
}

/**
 * 从浏览器快照解析推文
 */
function parseTweetsFromSnapshot(snapshot) {
  // 这里是模拟数据，实际应从浏览器返回的数据中解析
  // 在真实的 browser relay 使用中，会收到页面结构数据
  
  const tweets = [];
  
  // 尝试从 snapshot 中提取推文数据
  // 实际使用时需要根据 x.com 的 DOM 结构调整
  if (snapshot && snapshot.elements) {
    // 遍历元素寻找推文
    snapshot.elements.forEach(el => {
      if (el.role === 'article' || el['data-testid'] === 'tweet') {
        tweets.push({
          id: el.id || 'unknown',
          author: el.author || 'Unknown',
          username: el.username || 'unknown',
          content: el.content || el.text || '',
          retweets: parseInt(el.retweets) || 0,
          likes: parseInt(el.likes) || 0,
          replies: parseInt(el.replies) || 0,
          time: el.time || new Date().toISOString(),
          link: el.link || ''
        });
      }
    });
  }
  
  return tweets;
}

/**
 * 生成 WhatsApp 推送
 */
function generateWhatsAppOutput(tweets, args) {
  if (tweets.length === 0) {
    return '🐦 暂无值得推送的推文';
  }
  
  const hotTweets = tweets.filter(t => {
    const level = getHotLevel(t.score);
    return level.push;
  });
  
  if (hotTweets.length === 0 && args.hotOnly) {
    return '🐦 暂无热门推文（热度 < 70）';
  }
  
  const displayTweets = args.hotOnly ? hotTweets : tweets.slice(0, 10);
  
  const lines = [
    `🔥 X.com ${args.user ? `@${args.user}` : '推荐流'} (${displayTweets.length}条)`,
    ''
  ];
  
  displayTweets.forEach((tweet, index) => {
    const level = getHotLevel(tweet.score);
    
    lines.push('━━━━━━━━━━━━━━━');
    lines.push(`${level.emoji} **${tweet.author}** @${tweet.username}`);
    lines.push('');
    lines.push(tweet.content.substring(0, 150) + (tweet.content.length > 150 ? '...' : ''));
    lines.push('');
    lines.push(`🔥 热度: ${tweet.score}/100 (${level.level})`);
    lines.push(`🔄 ${formatNumber(tweet.retweets)} 转发 | ❤️ ${formatNumber(tweet.likes)} 喜欢 | 💬 ${formatNumber(tweet.replies)} 回复`);
    lines.push(`🕐 ${tweet.time}`);
    if (tweet.link) {
      lines.push(`🔗 ${tweet.link}`);
    }
    
    if (index < displayTweets.length - 1) {
      lines.push('');
    }
  });
  
  return lines.join('\n');
}

/**
 * 主函数 - 生成 Browser Relay 指令
 */
async function main() {
  const args = parseArgs();
  
  console.log('🐦 X.com Browser Relay');
  console.log('');
  
  if (args.user) {
    console.log(`👤 目标用户: @${args.user}`);
  } else {
    console.log('📱 目标: For You 推荐流');
  }
  console.log(`🔢 查看数量: ${args.count} 条`);
  console.log(`🔥 热度阈值: ${args.minScore}`);
  if (args.hotOnly) {
    console.log('📌 模式: 仅热门推文');
  }
  console.log('');
  
  // 生成浏览器指令
  const instructions = generateBrowserInstructions(args);
  
  console.log('📋 Browser Relay 指令:');
  console.log('');
  instructions.forEach((inst, i) => {
    console.log(`${i + 1}. ${inst.description}`);
  });
  
  console.log('');
  console.log('⚠️ 注意:');
  console.log('   1. 确保已登录 x.com');
  console.log('   2. 确保 OpenClaw Browser Relay 已连接');
  console.log('   3. 执行后将返回推文数据');
  
  // 输出指令供 Browser Relay 使用
  const outputData = {
    action: 'browser_relay',
    skill: 'x-browser-relay',
    instructions,
    config: {
      maxTweets: args.count,
      minScore: args.minScore,
      hotOnly: args.hotOnly
    },
    expectedOutput: {
      type: 'tweets',
      format: 'structured_data'
    }
  };
  
  console.log('');
  console.log('📤 BROWSER_RELAY_START');
  console.log(JSON.stringify(outputData, null, 2));
  console.log('📤 BROWSER_RELAY_END');
}

// 如果直接运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateBrowserInstructions,
  parseTweetsFromSnapshot,
  calculateScore,
  getHotLevel,
  generateWhatsAppOutput
};
