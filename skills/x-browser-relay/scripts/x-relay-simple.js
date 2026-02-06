#!/usr/bin/env node
/**
 * X.com Browser Relay 控制器
 * 通过 OpenClaw Browser Relay 访问 x.com
 * 
 * 使用方法:
 *   对 Agent 说: "帮我看看 x.com 推荐"
 *   或: "刷一下 x.com 有什么热门"
 * 
 * 输出: Browser Relay 指令供 Agent 执行
 */

const args = process.argv.slice(2);
const count = parseInt(args.find((_, i) => args[i-1] === '--count') || '20');
const user = args.find((_, i) => args[i-1] === '--user');

console.log('🐦 X.com Browser Relay 任务');
console.log('');

if (user) {
  console.log(`👤 目标: @${user} 的主页`);
} else {
  console.log('📱 目标: For You 推荐流');
}
console.log(`🔢 数量: ${count} 条推文`);
console.log('');

console.log('📋 执行步骤:');
console.log('');
console.log('1️⃣  打开 x.com');
console.log(`   → 访问: ${user ? `https://x.com/${user}` : 'https://x.com/home'}`);
console.log('');
console.log('2️⃣  等待加载');
console.log('   → 等待 3 秒让页面加载');
console.log('');

// 计算滚动次数
const scrollCount = Math.ceil(count / 5);
for (let i = 1; i <= scrollCount; i++) {
  console.log(`${i + 2}️⃣  滚动加载 (${i}/${scrollCount})`);
  console.log('   → 向下滚动 800px');
  console.log('   → 等待 2 秒');
  console.log('');
}

console.log(`${scrollCount + 3}️⃣  提取推文数据`);
console.log('   → 获取页面中的推文元素');
console.log('   → 提取: 作者、内容、转发、点赞、评论数');
console.log('');

console.log('📤 期望输出格式:');
console.log('   [作者] @[用户名]');
console.log('   [推文内容]');
console.log('   🔥 热度分数 (基于转发/点赞/评论)');
console.log('   🔄 X转发 | ❤️ X点赞 | 💬 X回复');
console.log('   🕐 发布时间');
console.log('');

console.log('🔥 热度计算:');
console.log('   转发 × 3 + 点赞 × 1 + 评论 × 2');
console.log('');
console.log('   ≥ 90: 🔥 爆款 (推送)');
console.log('   70-89: ⭐ 热门 (推送)');
console.log('   50-69: 📈 较热');
console.log('   < 50: 📊 普通');
console.log('');

console.log('⚠️ 注意事项:');
console.log('   • 确保已登录 x.com');
console.log('   • 确保 Browser Relay 扩展已启用');
console.log('   • 如果看到登录页，请先登录');
console.log('   • 提取时可能需要处理 "显示更多" 按钮');
console.log('');

// 输出给 Agent 的指令
const instructions = {
  task: 'x_com_scrape',
  url: user ? `https://x.com/${user}` : 'https://x.com/home',
  steps: [
    { action: 'navigate', url: user ? `https://x.com/${user}` : 'https://x.com/home' },
    { action: 'wait', timeMs: 3000 },
    ...Array(scrollCount).fill().map(() => ([
      { action: 'scroll', direction: 'down', amount: 800 },
      { action: 'wait', timeMs: 2000 }
    ])).flat(),
    { action: 'extract_tweets', maxCount: count }
  ],
  output: {
    format: 'structured',
    fields: ['author', 'username', 'content', 'retweets', 'likes', 'replies', 'time', 'link']
  }
};

console.log('📤 INSTRUCTIONS_START');
console.log(JSON.stringify(instructions, null, 2));
console.log('📤 INSTRUCTIONS_END');
