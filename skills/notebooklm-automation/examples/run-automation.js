#!/usr/bin/env node
/**
 * NotebookLM Automation - Main Entry Point
 * Usage: node run-automation.js <paper-url>
 */

const path = require('path');
const { spawn } = require('child_process');

const paperUrl = process.argv[2] || process.env.PAPER_URL;

if (!paperUrl) {
  console.error('❌ 错误: 请提供论文 URL');
  console.error('');
  console.error('用法:');
  console.error('  node run-automation.js <论文URL>');
  console.error('');
  console.error('示例:');
  console.error('  node run-automation.js https://arxiv.org/abs/2301.00001');
  console.error('  node run-automation.js "https://papers.nips.cc/paper/2023/file/123.pdf"');
  console.error('');
  console.error('环境变量:');
  console.error('  PAPER_URL - 论文 URL（可作为参数替代）');
  process.exit(1);
}

// Validate URL
try {
  new URL(paperUrl);
} catch {
  console.error('❌ 错误: 无效的 URL 格式');
  process.exit(1);
}

console.log('🚀 启动 NotebookLM 自动化...\n');

const scriptPath = path.join(__dirname, 'scripts', 'automate-notebooklm.js');
const child = spawn('node', [scriptPath, paperUrl], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('exit', (code) => {
  process.exit(code);
});
