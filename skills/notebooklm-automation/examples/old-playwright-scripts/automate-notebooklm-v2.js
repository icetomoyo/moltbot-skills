#!/usr/bin/env node
/**
 * NotebookLM Automation - Robust Version
 * Handles NotebookLM interface with precise selectors
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/icetomoyo/clawd';
const DOWNLOAD_DIR = path.join(WORKSPACE, 'content', 'notebooklm-output');
const PAPER_URL = process.argv[2] || 'https://arxiv.org/pdf/2601.22159v1';

// Ensure download dir
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

(async () => {
  console.log('🚀 NotebookLM Automation');
  console.log(`📄 Paper: ${PAPER_URL}\n`);
  
  // Connect to Chrome
  console.log('🔄 Connecting to Chrome on port 9222...');
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Connected!\n');
  } catch (e) {
    console.error('❌ Failed to connect:', e.message);
    console.log('Make sure Chrome is running with: --remote-debugging-port=9222');
    process.exit(1);
  }
  
  const contexts = browser.contexts();
  const context = contexts[0] || await browser.newContext();
  
  // Create new page for NotebookLM
  console.log('📖 Opening NotebookLM...');
  const page = await context.newPage();
  await page.goto('https://notebooklm.google.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  console.log('✅ NotebookLM loaded\n');
  
  // Step 1: Click "New Notebook" button
  console.log('Step 1: Creating new notebook...');
  
  // Try multiple selector strategies
  const newNotebookSelectors = [
    'button:has-text("New Notebook")',
    '[data-testid*="new-notebook"]',
    'button:has(> span:has-text("New"))',
    'button:has(> svg):has-text("New")',
    'role=button[name="New Notebook" i]',
    'text=New Notebook'
  ];
  
  let clicked = false;
  for (const selector of newNotebookSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        await element.click({ timeout: 5000 });
        console.log(`   ✅ Clicked: ${selector}`);
        clicked = true;
        break;
      }
    } catch {}
  }
  
  if (!clicked) {
    // Fallback: look for any button containing "New"
    console.log('   Trying fallback: searching all buttons...');
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      try {
        const text = await btn.textContent({ timeout: 1000 });
        if (text && text.toLowerCase().includes('new')) {
          await btn.click();
          console.log(`   ✅ Clicked button with text: ${text.trim()}`);
          clicked = true;
          break;
        }
      } catch {}
    }
  }
  
  if (!clicked) {
    console.log('   ❌ Could not find New Notebook button');
    console.log('   Please manually click "New Notebook" and press Enter...');
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
  }
  
  await page.waitForTimeout(3000);
  console.log('   ✅ Notebook created\n');
  
  // Step 2: Click "Add Source" 
  console.log('Step 2: Adding source...');
  
  const addSourceSelectors = [
    'button:has-text("Add source")',
    'button:has-text("Add Source")',
    '[data-testid*="add-source"]',
    'text=Add source',
    'button:has(> svg):has-text("Add")'
  ];
  
  clicked = false;
  for (const selector of addSourceSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        await element.click({ timeout: 5000 });
        console.log(`   ✅ Clicked: ${selector}`);
        clicked = true;
        break;
      }
    } catch {}
  }
  
  if (!clicked) {
    console.log('   ❌ Could not find Add Source button');
    console.log('   Please manually click "Add Source" and press Enter...');
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
  }
  
  await page.waitForTimeout(2000);
  
  // Step 3: Select "Website"
  console.log('Step 3: Selecting Website option...');
  
  try {
    await page.click('text=Website', { timeout: 5000 });
    console.log('   ✅ Clicked Website');
  } catch {
    console.log('   ⚠️  Website option not found or already selected');
  }
  
  await page.waitForTimeout(1000);
  
  // Step 4: Enter URL
  console.log('Step 4: Entering paper URL...');
  
  // Find URL input with multiple strategies
  let urlInput = null;
  
  // Strategy 1: By type and placeholder
  try {
    urlInput = page.locator('input[type="url"]').first();
    if (await urlInput.isVisible({ timeout: 2000 })) {
      console.log('   Found input[type="url"]');
    } else {
      urlInput = null;
    }
  } catch {}
  
  // Strategy 2: By placeholder
  if (!urlInput) {
    try {
      urlInput = page.locator('input[placeholder*="URL" i]').first();
      if (await urlInput.isVisible({ timeout: 2000 })) {
        console.log('   Found input by placeholder');
      } else {
        urlInput = null;
      }
    } catch {}
  }
  
  // Strategy 3: Any visible input
  if (!urlInput) {
    try {
      const inputs = await page.locator('input').all();
      for (const input of inputs) {
        if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
          urlInput = input;
          console.log('   Found visible input');
          break;
        }
      }
    } catch {}
  }
  
  if (urlInput) {
    await urlInput.fill(PAPER_URL);
    console.log('   ✅ URL entered');
  } else {
    console.log('   ❌ Could not find URL input');
    console.log('   Please manually paste the URL and press Enter...');
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
  }
  
  await page.waitForTimeout(1000);
  
  // Step 5: Click Add/Import
  console.log('Step 5: Submitting...');
  
  const submitSelectors = [
    'button:has-text("Add")',
    'button:has-text("Import")',
    'button[type="submit"]',
    'button:has-text("Save")'
  ];
  
  clicked = false;
  for (const selector of submitSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        await element.click({ timeout: 5000 });
        console.log(`   ✅ Clicked: ${selector}`);
        clicked = true;
        break;
      }
    } catch {}
  }
  
  if (!clicked) {
    console.log('   ⚠️  Submit button not found, trying Enter key...');
    try {
      await page.keyboard.press('Enter');
      console.log('   ✅ Pressed Enter');
    } catch {
      console.log('   ❌ Could not submit');
    }
  }
  
  console.log('\n⏳ Waiting for NotebookLM to process (2-3 minutes)...');
  console.log('   You can watch the progress in the Chrome window');
  
  // Wait for processing with progress checks
  for (let i = 0; i < 36; i++) { // 3 minutes max
    await page.waitForTimeout(5000);
    if (i % 12 === 0) {
      console.log(`   Processing... (${(i + 1) * 5}s)`);
    }
  }
  
  console.log('\n✅ Paper should be processed now!');
  console.log('📁 Check the Chrome window for the notebook');
  console.log('\n⚠️  Note: Video/Infographic/Presentation generation');
  console.log('   needs to be clicked manually in NotebookLM.');
  
  console.log('\n✨ Automation complete!');
  console.log('   Browser remains open for you to continue.');
  
})();
