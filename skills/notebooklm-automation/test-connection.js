const { chromium } = require('playwright-core');

(async () => {
  console.log('🔄 Connecting to Chrome...');
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  console.log('✅ Connected!');
  
  const contexts = browser.contexts();
  console.log(`📑 Contexts: ${contexts.length}`);
  
  const context = contexts[0];
  const pages = context.pages();
  console.log(`📄 Pages: ${pages.length}`);
  
  // Create new page
  const page = await context.newPage();
  console.log('🌐 Opening NotebookLM...');
  await page.goto('https://notebooklm.google.com');
  
  console.log('⏳ Waiting 5 seconds...');
  await page.waitForTimeout(5000);
  
  // Check if logged in
  const url = page.url();
  console.log(`📍 Current URL: ${url}`);
  
  if (url.includes('signin') || url.includes('login')) {
    console.log('⚠️  Please login to NotebookLM manually in the Chrome window');
    console.log('   Then press Enter here to continue...');
    
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
  } else {
    console.log('✅ Already on NotebookLM');
  }
  
  console.log('✅ Test complete!');
  console.log('   You can now use the automation script.');
  
  await browser.close();
})();
