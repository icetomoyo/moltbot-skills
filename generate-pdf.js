const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true
    });
    
    const page = await browser.newPage();
    
    // Read markdown and convert to HTML
    const md = fs.readFileSync('/Users/icetomoyo/clawd/memory/papers-2026-01-30.md', 'utf8');
    
    // Simple markdown to HTML conversion
    let html = md
      .replace(/^# (.*$)/gm, '<h1 style="color:#1976d2;border-bottom:2px solid #1976d2;padding-bottom:10px;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="color:#333;margin-top:30px;border-left:4px solid #1976d2;padding-left:10px;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="color:#555;margin-top:20px;">$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4 style="color:#666;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#1976d2;">$1</a>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/---/g, '<hr style="border:1px solid #ddd;margin:20px 0;">');
    
    // Wrap in HTML
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
p { margin: 10px 0; }
li { margin: 5px 0; }
table { border-collapse: collapse; width: 100%; margin: 15px 0; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
th { background-color: #f5f5f5; }
</style>
</head>
<body>
${html}
</body>
</html>`;
    
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: '/Users/icetomoyo/clawd/memory/papers-2026-01-30.pdf',
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
    await browser.close();
    console.log('PDF generated successfully!');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
