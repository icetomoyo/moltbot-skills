#!/usr/bin/env node
/**
 * NotebookLM Automation
 * Automates the process of creating a notebook, adding paper URL, and generating content
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const SKILL_DIR = __dirname;
const WORKSPACE = process.env.WORKSPACE || '/Users/icetomoyo/clawd';

// Configuration
const CONFIG = {
  notebooklmUrl: 'https://notebooklm.google.com',
  chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  userDataDir: '/Users/icetomoyo/Library/Application Support/Google/Chrome',
  downloadDir: path.join(WORKSPACE, 'content', 'notebooklm-output')
};

function ensureDependencies() {
  const pkgPath = path.join(SKILL_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    const pkg = {
      name: "notebooklm-automation",
      version: "1.0.0",
      dependencies: {
        "playwright-core": "^1.40.0"
      }
    };
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
  
  const modulePath = path.join(SKILL_DIR, 'node_modules', 'playwright-core');
  if (!fs.existsSync(modulePath)) {
    console.error('📦 Installing Playwright...');
    try {
      require('child_process').execSync('npm install', { 
        cwd: SKILL_DIR, 
        stdio: 'inherit',
        timeout: 120000 
      });
      console.error('✅ Playwright installed');
    } catch (e) {
      console.error('❌ Failed to install Playwright:', e.message);
      process.exit(1);
    }
  }
  
  // Ensure download directory exists
  if (!fs.existsSync(CONFIG.downloadDir)) {
    fs.mkdirSync(CONFIG.downloadDir, { recursive: true });
  }
}

async function automateNotebookLM(paperUrl) {
  console.log(`🚀 Starting NotebookLM automation for: ${paperUrl}`);
  
  const browser = await chromium.launch({
    executablePath: CONFIG.chromePath,
    headless: false, // Show browser so you can see the automation
    args: [
      `--user-data-dir=${CONFIG.userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Open NotebookLM
    console.log('📖 Opening NotebookLM...');
    await page.goto(CONFIG.notebooklmUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Step 2: Click "New Notebook"
    console.log('➕ Creating new notebook...');
    const newNotebookBtn = await page.locator('button:has-text("New Notebook"), [aria-label*="new" i]').first();
    if (await newNotebookBtn.isVisible().catch(() => false)) {
      await newNotebookBtn.click();
    } else {
      // Try alternative selectors
      await page.click('text=New Notebook');
    }
    await page.waitForTimeout(2000);
    
    // Step 3: Add paper URL as source
    console.log('🔗 Adding paper URL as source...');
    
    // Look for "Add Source" or "Import" button
    const addSourceBtn = await page.locator('button:has-text("Add source"), button:has-text("Import"), [aria-label*="add source" i]').first();
    if (await addSourceBtn.isVisible().catch(() => false)) {
      await addSourceBtn.click();
    }
    await page.waitForTimeout(2000);
    
    // Select "Website" option
    const websiteOption = await page.locator('text=Website, [aria-label*="website" i], button:has-text("Website")').first();
    if (await websiteOption.isVisible().catch(() => false)) {
      await websiteOption.click();
    }
    await page.waitForTimeout(1000);
    
    // Enter paper URL
    const urlInput = await page.locator('input[type="url"], input[placeholder*="URL" i], input[name*="url" i]').first();
    await urlInput.fill(paperUrl);
    await page.waitForTimeout(1000);
    
    // Click Add/Import
    const importBtn = await page.locator('button:has-text("Add"), button:has-text("Import"), button[type="submit"]').first();
    await importBtn.click();
    
    console.log('⏳ Waiting for NotebookLM to process the paper...');
    console.log('   This may take 1-3 minutes...');
    
    // Wait for processing (check for loading indicator to disappear)
    await page.waitForTimeout(30000); // Initial wait
    
    // Wait for content to be ready (look for "Sources" section or content)
    let processingComplete = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (!processingComplete && attempts < maxAttempts) {
      await page.waitForTimeout(5000);
      attempts++;
      
      // Check if source is ready (look for specific indicators)
      const sourceReady = await page.locator('text=Sources, .source-item, [data-testid*="source"]').count() > 0;
      const noLoading = await page.locator('text=Loading, .loading-spinner, [aria-busy="true"]').count() === 0;
      
      if (sourceReady && noLoading) {
        processingComplete = true;
        console.log(`✅ Paper processed successfully! (${attempts * 5}s)`);
      } else {
        process.stdout.write('.');
      }
    }
    
    if (!processingComplete) {
      console.log('\n⚠️ Processing timeout - but may still be ready');
    }
    
    // Step 4: Generate content
    console.log('\n🎨 Generating content...');
    
    // Generate Video
    console.log('🎬 Clicking "Generate Video"...');
    const videoBtn = await page.locator('button:has-text("Video"), button:has-text("Generate video"), [aria-label*="video" i]').first();
    if (await videoBtn.isVisible().catch(() => false)) {
      await videoBtn.click();
      console.log('   Video generation started');
      await page.waitForTimeout(5000);
    }
    
    // Generate Infographic
    console.log('📊 Clicking "Generate Infographic"...');
    const infographicBtn = await page.locator('button:has-text("Infographic"), button:has-text("Generate infographic"), [aria-label*="infographic" i]').first();
    if (await infographicBtn.isVisible().catch(() => false)) {
      await infographicBtn.click();
      console.log('   Infographic generation started');
      await page.waitForTimeout(5000);
    }
    
    // Generate Presentation
    console.log('📽️ Clicking "Generate Presentation"...');
    const presentationBtn = await page.locator('button:has-text("Presentation"), button:has-text("Slides"), button:has-text("Generate presentation"), [aria-label*="presentation" i]').first();
    if (await presentationBtn.isVisible().catch(() => false)) {
      await presentationBtn.click();
      console.log('   Presentation generation started');
      await page.waitForTimeout(5000);
    }
    
    // Step 5: Wait for all generations and download
    console.log('\n⏳ Waiting for all content to be generated...');
    console.log('   This may take 2-5 minutes...');
    await page.waitForTimeout(120000); // Wait 2 minutes for generation
    
    // Try to download generated content
    console.log('💾 Attempting to download generated content...');
    
    // Look for download buttons
    const downloadButtons = await page.locator('button:has-text("Download"), button:has-text("Export"), a[download]').all();
    console.log(`   Found ${downloadButtons.length} download options`);
    
    for (let i = 0; i < Math.min(downloadButtons.length, 3); i++) {
      try {
        const btn = downloadButtons[i];
        const text = await btn.textContent();
        console.log(`   Downloading: ${text || 'Content ' + (i + 1)}`);
        
        // Setup download listener
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 30000 }),
          btn.click()
        ]);
        
        const downloadPath = path.join(CONFIG.downloadDir, download.suggestedFilename());
        await download.saveAs(downloadPath);
        console.log(`   ✅ Saved: ${downloadPath}`);
      } catch (e) {
        console.log(`   ⚠️ Download ${i + 1} failed: ${e.message}`);
      }
    }
    
    console.log('\n✅ Automation complete!');
    console.log(`📁 Check ${CONFIG.downloadDir} for downloaded content`);
    
    // Keep browser open for a bit so user can see results
    console.log('⏳ Browser will close in 30 seconds...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error during automation:', error.message);
    console.log('\n⚠️ Browser will remain open for debugging');
    console.log('   Close manually when done');
    
    // Don't close browser on error so user can debug
    await page.waitForTimeout(60000);
  } finally {
    await browser.close();
  }
}

// Main function
async function main() {
  try {
    ensureDependencies();
    
    // Get paper URL from command line or environment
    const paperUrl = process.argv[2] || process.env.PAPER_URL;
    
    if (!paperUrl) {
      console.error('❌ Error: Please provide a paper URL');
      console.error('Usage: node automate-notebooklm.js <paper-url>');
      console.error('   or: PAPER_URL=<url> node automate-notebooklm.js');
      process.exit(1);
    }
    
    // Validate URL
    try {
      new URL(paperUrl);
    } catch {
      console.error('❌ Error: Invalid URL provided');
      process.exit(1);
    }
    
    await automateNotebookLM(paperUrl);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
