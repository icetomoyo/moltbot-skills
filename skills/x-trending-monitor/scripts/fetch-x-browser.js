#!/usr/bin/env node
/**
 * X Trending Monitor - Browser Automation Helper
 * Uses OpenClaw browser tool to fetch tweets from X.com
 * 
 * Usage: node fetch-x-browser.js
 * Or call via OpenClaw agent
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Search configurations
const SEARCH_CONFIGS = [
  {
    name: 'AI/LLM热门',
    url: 'https://x.com/search?q=(GPT-5%20OR%20Claude-4%20OR%20Gemini-2.5%20OR%20DeepSeek%20OR%20%22AI%20breakthrough%22)%20min_faves%3A100%20lang%3Aen&f=live',
    keywords: ['GPT-5', 'Claude 4', 'Gemini 2.5', 'DeepSeek', 'Llama 4', 'AI breakthrough']
  },
  {
    name: 'Robotics热门',
    url: 'https://x.com/search?q=(Figure-02%20OR%20Figure-03%20OR%20Optimus%20OR%20%22Tesla%20Bot%22%20OR%20%22humanoid%20robot%22)%20min_faves%3A50%20lang%3Aen&f=live',
    keywords: ['Figure 02', 'Figure 03', 'Optimus', 'Tesla Bot', 'humanoid', 'robotics']
  },
  {
    name: 'VLA热门',
    url: 'https://x.com/search?q=(VLA%20OR%20%22vision%20language%20action%22%20OR%20OpenVLA%20OR%20%22pi-zero%22%20OR%20%22RT-2%22)%20min_faves%3A30%20lang%3Aen&f=live',
    keywords: ['VLA', 'OpenVLA', 'π0', 'pi-zero', 'RT-2', 'vision language action']
  },
  {
    name: 'WorldModel热门',
    url: 'https://x.com/search?q=(%22world%20model%22%20OR%20%22world%20models%22%20OR%20JEPA%20OR%20%22Sora%20Turbo%22%20OR%20DreamerV3)%20min_faves%3A30%20lang%3Aen&f=live',
    keywords: ['world model', 'JEPA', 'Sora Turbo', 'DreamerV3', 'UniWorld']
  }
];

// This script outputs instructions for the OpenClaw agent
// The agent will use browser tool to visit these URLs

console.log('🔥 X Trending Monitor - Browser Instructions\n');
console.log('由于 X.com 需要登录和 JavaScript 渲染，请使用以下步骤：\n');

console.log('📋 执行步骤:\n');

SEARCH_CONFIGS.forEach((config, i) => {
  console.log(`${i + 1}. 打开 ${config.name} 搜索:`);
  console.log(`   URL: ${config.url}`);
  console.log(`   browser action=open profile=chrome targetUrl="${config.url}"`);
  console.log(`   sleep 3000`);
  console.log(`   browser action=snapshot profile=chrome refs=aria`);
  console.log('');
});

console.log('\n📊 数据提取提示:\n');
console.log('从 X.com 页面提取以下信息:');
console.log('- 推文作者 (@username)');
console.log('- 推文内容');
console.log('- 点赞数 (likes)');
console.log('- 转发数 (retweets)');
console.log('- 回复数 (replies)');
console.log('- 时间戳');
console.log('');

console.log('💡 建议:\n');
console.log('1. X.com 需要登录，确保 Chrome 已登录 X/Twitter 账号');
console.log('2. 搜索使用 min_faves 过滤器获取高热度推文');
console.log('3. 每 2-4 小时运行一次，避免频繁访问');
console.log('4. 保存数据到: skills/x-trending-monitor/output/');
console.log('');

console.log('🔗 快捷链接:\n');
SEARCH_CONFIGS.forEach(config => {
  console.log(`${config.name}:`);
  console.log(`  ${config.url}\n`);
});

// Export for programmatic use
module.exports = { SEARCH_CONFIGS };
