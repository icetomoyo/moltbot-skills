#!/usr/bin/env node
/**
 * NotebookLM Automation - v2 with precise selectors
 * Based on actual HTML structure analysis
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const SKILL_DIR = __dirname;
const WORKSPACE = process.env.WORKSPACE || '/Users/icetomoyo/clawd';

const CONFIG = {
  notebooklmUrl: 'https://notebooklm.google.com',
  chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  userDataDir: '/tmp/chrome-debug',  // Use existing logged-in profile
  downloadDir: path.join(WORKSPACE, 'content', 'notebooklm-output'),
  remoteDebugPort: 9222
};

// Utility: Sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Utility: Safe click with fallback
async function safeClick(page, selectors, timeout = 5000) {
  for (const selector of selectors) {
    try {
      const el = await page.locator(selector).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        await el.click({ timeout });
        return true;
      }
    } catch {}
  }
  return false;
}

// Utility: Wait and click with retry
async function waitAndClick(page, selectors, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await safeClick(page, selectors)) {
      return true;
    }
    await sleep(1000);
  }
  return false;
}

async function tryConnectExistingChrome() {
  console.log('🔍 尝试连接已有的 Chrome 实例...');
  try {
    const browser = await chromium.connectOverCDP(`http://localhost:${CONFIG.remoteDebugPort}`);
    console.log('✅ 成功连接到已有 Chrome 实例');
    return browser;
  } catch (e) {
    console.log('⚠️ 无法连接已有 Chrome，需要启动新的实例');
    return null;
  }
}

async function killChrome() {
  return new Promise((resolve) => {
    console.log('🔪 停止占用端口 9222 的进程...');
    exec('lsof -ti:9222 | xargs kill -9 2>/dev/null', () => {
      setTimeout(resolve, 2000);
    });
  });
}

async function startChrome() {
  console.log('🚀 Starting Chrome with remote debugging on port 9222...');
  
  return new Promise((resolve, reject) => {
    const chromeProcess = spawn(CONFIG.chromePath, [
      `--remote-debugging-port=${CONFIG.remoteDebugPort}`,
      `--user-data-dir=${CONFIG.userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--enable-automation',
      '--disable-blink-features=AutomationControlled',
      CONFIG.notebooklmUrl
    ], {
      detached: true,
      stdio: 'ignore'
    });
    
    chromeProcess.unref();
    
    // Wait for Chrome to be ready
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkConnection = () => {
      const test = spawn('bash', ['-c', `curl -s http://localhost:${CONFIG.remoteDebugPort}/json/version > /dev/null && echo "ready"`]);
      let output = '';
      test.stdout.on('data', d => output += d);
      
      test.on('exit', () => {
        if (output.includes('ready')) {
          console.log('✅ Chrome is ready');
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkConnection, 1000);
        } else {
          reject(new Error('Chrome failed to start'));
        }
      });
    };
    
    setTimeout(checkConnection, 3000);
  });
}

async function checkLoginStatus(page) {
  console.log('   检查登录状态...');
  
  const loginIndicators = [
    'text=登录',
    'text=Sign in',
    'text=创建账号',
    'text=Create account',
    'text=下一步',
    'text=Next',
    'text=忘记了邮箱',
    'text=Forgot email',
    'input[type="email"]',
    'input[name="identifier"]'
  ];
  
  for (const selector of loginIndicators) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      return false; // Not logged in
    }
  }
  
  return true; // Likely logged in
}

async function checkIfInNotebook(page) {
  // Check if we're already inside a notebook (not on the notebooks list page)
  const notebookIndicators = [
    'text=AI 模式',
    'text=AI Mode',
    'text=查找主题',
    'text=Find topics',
    '[aria-label*="source" i]',
    '[aria-label*="来源" i]',
    'text=添加来源',
    'text=Add source'
  ];
  
  for (const selector of notebookIndicators) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      return true; // Already in a notebook
    }
  }
  return false;
}

async function createNewNotebook(page) {
  console.log('\n➕ 步骤 1: 检查页面状态...');
  
  await sleep(5000); // Wait for page to fully render
  
  // Check if we need to log in
  const isLoggedIn = await checkLoginStatus(page);
  
  if (!isLoggedIn) {
    console.log('\n⚠️ 检测到 Google 登录页面');
    console.log('   请先手动登录 Google 账号，然后按回车继续...');
    console.log('   或者您可以：');
    console.log('   1. 在 Chrome 中完成登录');
    console.log('   2. 关闭 Chrome');
    console.log('   3. 重新运行此脚本');
    
    await page.screenshot({ path: path.join(CONFIG.downloadDir, 'login-required.png') });
    console.log(`   📸 截图已保存: ${path.join(CONFIG.downloadDir, 'login-required.png')}`);
    
    // Wait for user to press Enter in terminal
    console.log('\n   等待登录完成...（请在Chrome中完成登录）');
    await sleep(30000); // Wait 30 seconds for manual login
    
    // Check again
    const nowLoggedIn = await checkLoginStatus(page);
    if (!nowLoggedIn) {
      throw new Error('未完成登录，请手动登录后重试');
    }
    
    console.log('   ✅ 登录状态已确认');
  }
  
  // Check if already in a notebook
  const alreadyInNotebook = await checkIfInNotebook(page);
  if (alreadyInNotebook) {
    console.log('   ✅ 当前已在一个笔记本中，跳过创建步骤');
    return;
  }
  
  // We're on the notebooks list page, need to create a new one
  console.log('   当前在笔记本列表页，创建新笔记本...');
  
  // Try multiple strategies for "+ 新建" button
  const newButtonSelectors = [
    'text=New Notebook',
    'text=新建笔记本',
    'text=New',
    'text=新建',
    'button:has-text("New Notebook")',
    'button:has-text("新建笔记本")',
    'button:has-text("New")',
    'button:has-text("新建")',
    '[aria-label*="new notebook" i]',
    '[aria-label*="新建笔记本" i]',
    '[aria-label*="new" i]',
    '[role="button"]:has-text("New")',
    '[role="button"]:has-text("新建")',
    '[data-testid*="new" i]',
    '[data-testid*="create" i]',
    'header button',
    'nav button',
    '[role="navigation"] button'
  ];
  
  // Debug: log all buttons
  console.log('   扫描页面按钮...');
  const allButtons = await page.locator('button, [role="button"]').all();
  console.log(`   找到 ${allButtons.length} 个按钮`);
  
  for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
    try {
      const text = await allButtons[i].textContent({ timeout: 1000 });
      const ariaLabel = await allButtons[i].getAttribute('aria-label');
      if (text || ariaLabel) {
        console.log(`     [${i}] text: "${(text || '').substring(0, 50)}" aria: "${ariaLabel || ''}"`);
      }
    } catch {}
  }
  
  if (await waitAndClick(page, newButtonSelectors, 5)) {
    console.log('   ✅ 已点击 "+ 新建" 按钮');
  } else {
    console.log('   ⚠️ 无法定位 "+ 新建" 按钮，尝试截图分析...');
    await page.screenshot({ path: path.join(CONFIG.downloadDir, 'debug-new-button.png') });
    throw new Error('无法找到新建按钮');
  }
  
  await sleep(3000);
}

async function addSource(page, paperUrl) {
  console.log('\n🔗 步骤 2: 添加论文来源...');
  
  // Click "Add source" or similar
  const addSourceSelectors = [
    'button:has-text("添加来源")',
    'button:has-text("Add source")',
    'button:has-text("来源")',
    'button:has-text("Source")',
    '[aria-label*="add source" i]',
    '[aria-label*="添加来源" i]'
  ];
  
  if (await waitAndClick(page, addSourceSelectors, 5)) {
    console.log('   ✅ 已点击 "添加来源"');
  } else {
    console.log('   ⚠️ 未找到 "添加来源" 按钮，可能已在新笔记本页面');
  }
  
  await sleep(2000);
  
  // Select "Website" option
  console.log('   选择 "网站" 选项...');
  const websiteSelectors = [
    'text=Website',
    'text=网站',
    'button:has-text("Website")',
    'button:has-text("网站")',
    '[role="option"]:has-text("Website")',
    '[role="option"]:has-text("网站")'
  ];
  
  if (await waitAndClick(page, websiteSelectors, 3)) {
    console.log('   ✅ 已选择 "网站"');
  }
  
  await sleep(1000);
  
  // Enter URL
  console.log('   输入论文 URL...');
  const urlInputSelectors = [
    'input[type="url"]',
    'input[placeholder*="URL" i]',
    'input[placeholder*="网址" i]',
    'input[aria-label*="URL" i]',
    'input[aria-label*="网址" i]',
    'input[name*="url" i]'
  ];
  
  let urlInputFound = false;
  for (const selector of urlInputSelectors) {
    try {
      const input = await page.locator(selector).first();
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        await input.fill(paperUrl);
        urlInputFound = true;
        console.log('   ✅ URL 已输入');
        break;
      }
    } catch {}
  }
  
  if (!urlInputFound) {
    throw new Error('无法找到 URL 输入框');
  }
  
  await sleep(1000);
  
  // Click Add/Import button
  const importSelectors = [
    'button:has-text("添加")',
    'button:has-text("Add")',
    'button:has-text("导入")',
    'button:has-text("Import")',
    'button[type="submit"]'
  ];
  
  if (await waitAndClick(page, importSelectors, 3)) {
    console.log('   ✅ 已开始导入');
  }
}

async function waitForProcessing(page) {
  console.log('\n⏳ 步骤 3: 等待 NotebookLM 处理论文...');
  
  const startTime = Date.now();
  const maxWaitTime = 10 * 60 * 1000; // 10 minutes max
  const checkInterval = 5000;
  
  while (Date.now() - startTime < maxWaitTime) {
    await sleep(checkInterval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      // Check for completion indicators
      const hasSources = await page.locator('.source-list-item, [data-testid*="source"], .source-card').count() > 0;
      const isProcessing = await page.locator('text=Processing, text=处理中, .processing, [aria-busy="true"]').count() > 0;
      const hasContent = await page.locator('.notebook-content, .chat-interface, [data-testid*="chat"]').count() > 0;
      
      if (hasSources && !isProcessing) {
        console.log(`   ✅ 处理完成！用时 ${elapsed} 秒`);
        return true;
      }
      
      // Progress update every 30 seconds
      if (elapsed % 30 === 0) {
        console.log(`   仍在处理中... (${elapsed}s)`);
      }
    } catch {}
  }
  
  console.log('   ⚠️ 处理超时，但继续执行...');
  return false;
}

async function generateContent(page) {
  console.log('\n🎨 步骤 4: 生成内容...');
  
  const contentTypes = [
    { name: '视频', en: 'Video', emoji: '🎬' },
    { name: '信息图', en: 'Infographic', emoji: '📊' },
    { name: '演示文稿', en: 'Presentation', emoji: '📽️' }
  ];
  
  for (const type of contentTypes) {
    console.log(`   ${type.emoji} 生成${type.name}...`);
    
    const selectors = [
      `button:has-text("${type.name}")`,
      `button:has-text("${type.en}")`,
      `[aria-label*="${type.en.toLowerCase()}" i]`,
      `text=${type.name}`,
      `text=${type.en}`
    ];
    
    if (await waitAndClick(page, selectors, 3)) {
      console.log(`      ✅ ${type.name} 已开始生成`);
      await sleep(3000);
    } else {
      console.log(`      ⚠️ ${type.name} 按钮未找到`);
    }
  }
  
  console.log('\n⏳ 等待内容生成完成（约 3-5 分钟）...');
  await sleep(180000); // 3 minutes
}

async function downloadContent(page) {
  console.log('\n💾 步骤 5: 下载生成的内容...');
  
  if (!fs.existsSync(CONFIG.downloadDir)) {
    fs.mkdirSync(CONFIG.downloadDir, { recursive: true });
  }
  
  const downloadSelectors = [
    'button:has-text("下载")',
    'button:has-text("Download")',
    'button:has-text("导出")',
    'button:has-text("Export")',
    'a:has-text("下载")',
    'a:has-text("Download")'
  ];
  
  const downloadButtons = await page.locator(downloadSelectors.join(', ')).all();
  console.log(`   找到 ${downloadButtons.length} 个下载按钮`);
  
  let downloadedCount = 0;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  for (let i = 0; i < Math.min(downloadButtons.length, 5); i++) {
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30000 }),
        downloadButtons[i].click()
      ]);
      
      const filename = `${timestamp}-${i}-${download.suggestedFilename()}`;
      const savePath = path.join(CONFIG.downloadDir, filename);
      await download.saveAs(savePath);
      downloadedCount++;
      console.log(`   ✅ 已下载: ${filename}`);
    } catch (e) {
      console.log(`   ⚠️ 下载失败: ${e.message}`);
    }
    
    await sleep(1000);
  }
  
  console.log(`\n📁 文件保存位置: ${CONFIG.downloadDir}`);
  console.log(`📊 成功下载: ${downloadedCount} 个文件`);
}

async function automate(paperUrl) {
  console.log('='.repeat(60));
  console.log('📓 NotebookLM 自动化');
  console.log(`🔗 论文 URL: ${paperUrl}`);
  console.log('='.repeat(60));
  
  // Try to connect to existing Chrome first
  let browser = await tryConnectExistingChrome();
  
  if (!browser) {
    // Start new Chrome if connection failed
    await killChrome();
    await startChrome();
    
    console.log('\n🔄 连接到 Chrome...');
    browser = await chromium.connectOverCDP(`http://localhost:${CONFIG.remoteDebugPort}`);
  }
  
  const contexts = browser.contexts();
  const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
  
  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();
  
  if (pages.length === 0) {
    await page.goto(CONFIG.notebooklmUrl);
  }
  
  console.log('✅ 已连接到页面');
  await sleep(5000);
  
  try {
    // Execute workflow
    await createNewNotebook(page);
    await addSource(page, paperUrl);
    await waitForProcessing(page);
    await generateContent(page);
    await downloadContent(page);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 自动化流程完成！');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    
    // Save debug screenshot
    const debugPath = path.join(CONFIG.downloadDir, `error-${Date.now()}.png`);
    await page.screenshot({ path: debugPath, fullPage: true });
    console.log(`📸 调试截图已保存: ${debugPath}`);
    
    throw error;
  }
  
  console.log('\n💡 Chrome 保持打开状态，你可以继续手动操作');
  console.log('   完成后请手动关闭 Chrome');
}

// Main
async function main() {
  const paperUrl = process.argv[2] || process.env.PAPER_URL;
  
  if (!paperUrl) {
    console.error('❌ 错误: 请提供论文 URL');
    console.error('用法: node automate-notebooklm.js <论文URL>');
    console.error('例如: node automate-notebooklm.js https://arxiv.org/abs/2301.00001');
    process.exit(1);
  }
  
  try {
    new URL(paperUrl);
  } catch {
    console.error('❌ 错误: 无效的 URL');
    process.exit(1);
  }
  
  try {
    await automate(paperUrl);
  } catch (error) {
    console.error('\n❌ 致命错误:', error.message);
    process.exit(1);
  }
}

main();
