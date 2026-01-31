const { chromium } = require('playwright-core');

(async () => {
  console.log('Connecting to Chrome...');
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();
  
  console.log('Opening NotebookLM...');
  await page.goto('https://notebooklm.google.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  
  console.log('\n=== Page Analysis ===');
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  
  // Screenshot
  await page.screenshot({ path: '/Users/icetomoyo/clawd/notebooklm-screenshot.png', fullPage: true });
  console.log('\n✅ Screenshot saved: notebooklm-screenshot.png');
  
  // Find all buttons
  console.log('\n=== All Buttons ===');
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons:`);
  
  for (let i = 0; i < Math.min(buttons.length, 20); i++) {
    try {
      const text = await buttons[i].textContent();
      const visible = await buttons[i].isVisible();
      console.log(`  ${i + 1}. "${text?.trim()}" (visible: ${visible})`);
    } catch {}
  }
  
  // Find elements with "新建" or "New"
  console.log('\n=== Elements with "新建" or "New" ===');
  const elements = await page.locator('*').all();
  let found = 0;
  for (const el of elements) {
    try {
      const text = await el.textContent();
      if (text && (text.includes('新建') || text.toLowerCase().includes('new'))) {
        const tag = await el.evaluate(e => e.tagName);
        console.log(`  ${tag}: "${text?.trim()}"`);
        found++;
        if (found >= 10) break;
      }
    } catch {}
  }
  
  console.log('\n=== Analysis Complete ===');
  await browser.close();
})();
