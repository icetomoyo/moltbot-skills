---
name: notebooklm-automation
description: Automate NotebookLM workflow using OpenClaw browser tool with Chrome extension relay. Creates notebook, adds paper URL as source, and generates video, infographic, and presentation. Use when users want to process research papers through Google's NotebookLM with browser automation.
---

# NotebookLM Automation

## Overview

This skill automates Google NotebookLM workflow for research papers using **OpenClaw's browser tool with Chrome extension relay**.

**Prerequisites:**
- Chrome with OpenClaw Browser Relay extension installed and enabled
- User logged into NotebookLM in Chrome
- Extension badge showing "ON" on the NotebookLM tab

**Workflow:**
1. Use `browser` tool to control Chrome via extension relay
2. Click "新建笔记本" (New Notebook)
3. Add paper URL as source
4. Generate video, infographic, and presentation

## Quick Start

### Step 1: Setup Chrome Extension

Install the OpenClaw Browser Relay extension:

```bash
# Install extension files
openclaw browser extension install

# Get extension path
openclaw browser extension path
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" 
4. Select the path from above
5. Pin the extension to toolbar

### Step 2: Attach to NotebookLM Tab

1. Open https://notebooklm.google.com in Chrome
2. Ensure you're logged in
3. Click the OpenClaw Browser Relay extension icon (badge shows "ON")

### Step 3: Run Automation

Use the `browser` tool with `profile="chrome"`:

```javascript
// 1. Check current page
browser action=snapshot profile=chrome

// 2. Click "New Notebook" button
browser action=act profile=chrome request={"kind":"click","ref":"e12"}

// 3. Click "Website" source option
browser action=act profile=chrome request={"kind":"click","ref":"e7"}

// 4. Enter paper URL
browser action=act profile=chrome request={"kind":"type","ref":"e2","text":"https://arxiv.org/pdf/2601.22156v1"}

// 5. Click "Insert"
browser action=act profile=chrome request={"kind":"click","ref":"e4"}

// 6. Generate content (video, infographic, presentation)
browser action=act profile=chrome request={"kind":"click","ref":"e28"}  // Video
browser action=act profile=chrome request={"kind":"click","ref":"e44"}  // Infographic
browser action=act profile=chrome request={"kind":"click","ref":"e46"}  // Presentation
```

## Detailed Workflow

### Phase 1: Create Notebook

**Get page snapshot:**
```javascript
browser action=snapshot profile=chrome
```

**Look for:**
- `button "新建笔记本" [ref=e12]` - New Notebook button
- `button "New Notebook" [ref=eXX]` - English variant

**Click to create:**
```javascript
browser action=act profile=chrome request={"kind":"click","ref":"e12"}
```

**Result:** Dialog opens with source options

### Phase 2: Add Paper URL

**Select "Website" source:**
```javascript
browser action=act profile=chrome request={"kind":"click","ref":"e7"}
```

**Enter URL:**
```javascript
browser action=act profile=chrome request={"kind":"type","ref":"e2","text":"PAPER_URL"}
```

**Click Insert:**
```javascript
browser action=act profile=chrome request={"kind":"click","ref":"e4"}
```

**Result:** Notebook created with paper as source

### Phase 3: Generate Content

**Check processing status:**
```javascript
browser action=snapshot profile=chrome
```

**Look for:**
- `text: "1 个来源"` - Source added successfully
- `heading "Untitled notebook"` - Ready to generate

**Generate Video:**
```javascript
browser action=act profile=chrome request={"kind":"click","ref":"e28"}
```

**Generate Infographic:**
```javascript
browser action=act profile=chrome request={"kind":"click","ref":"e44"}
```

**Generate Presentation:**
```javascript
browser action=act profile=chrome request={"kind":"click","ref":"e46"}
```

**Monitor generation:**
```javascript
browser action=snapshot profile=chrome
// Look for: "正在生成视频概览", "正在生成信息图", "正在生成演示文稿"
```

## Common Element References

### Notebook List Page
- `button "新建笔记本"` - New Notebook (Chinese)
- `button "New Notebook"` - New Notebook (English)
- `button:has-text("新建")` - Alternative selector

### Source Dialog
- `button "网站"` - Website option
- `button "Website"` - Website option (English)
- `textbox "输入网址"` - URL input field
- `textbox "Enter URL"` - URL input (English)
- `button "插入"` - Insert button
- `button "Insert"` - Insert button (English)

### Studio Panel (Generation)
- `button "视频概览"` - Video Overview
- `button "Video Overview"` - Video Overview (English)
- `button "信息图"` - Infographic
- `button "Infographic"` - Infographic (English)
- `button "演示文稿"` - Presentation
- `button "Presentation"` - Presentation (English)

### Status Indicators
- `text: "正在生成视频概览"` - Video generating
- `text: "正在生成信息图"` - Infographic generating
- `text: "正在生成演示文稿"` - Presentation generating
- `text: "1 个来源"` - 1 source added

## Troubleshooting

### Extension Shows "!" Badge
**Problem:** Relay not reachable
**Solution:** 
```bash
# Ensure Gateway is running
openclaw gateway status
# or restart
openclaw gateway restart
```

### "Can't reach browser control service"
**Problem:** Browser service not running
**Solution:**
```bash
# Check browser status
openclaw browser status

# Start if needed
openclaw browser start
```

### Page Not Found / Wrong Page
**Problem:** Not on NotebookLM
**Solution:**
```javascript
// Navigate to NotebookLM
browser action=navigate profile=chrome targetUrl="https://notebooklm.google.com"
```

### Login Required
**Problem:** Not logged into Google
**Solution:** Manually log in via Chrome, then re-attach extension

## Full Example Script

```javascript
/**
 * NotebookLM Automation Example
 * Run this as an agent task or in a session
 */

async function automateNotebookLM(paperUrl) {
  console.log(`🚀 Starting NotebookLM automation for: ${paperUrl}`);
  
  // Step 1: Get snapshot and find New Notebook button
  console.log('➕ Creating new notebook...');
  const snapshot1 = await browser({ action: 'snapshot', profile: 'chrome', compact: true });
  
  // Look for New Notebook button (try Chinese first, then English)
  const newNotebookBtn = snapshot1.find(el => 
    el.text?.includes('新建笔记本') || 
    el.text?.includes('New Notebook')
  );
  
  if (!newNotebookBtn) {
    throw new Error('New Notebook button not found');
  }
  
  await browser({ 
    action: 'act', 
    profile: 'chrome', 
    request: { kind: 'click', ref: newNotebookBtn.ref }
  });
  
  // Step 2: Add website source
  console.log('🔗 Adding paper URL...');
  await sleep(1000);
  
  const snapshot2 = await browser({ action: 'snapshot', profile: 'chrome', compact: true });
  
  // Find Website button
  const websiteBtn = snapshot2.find(el => 
    el.text?.includes('网站') || 
    el.text?.includes('Website')
  );
  await browser({ action: 'act', profile: 'chrome', request: { kind: 'click', ref: websiteBtn.ref } });
  
  // Enter URL
  await sleep(500);
  const snapshot3 = await browser({ action: 'snapshot', profile: 'chrome', compact: true });
  const urlInput = snapshot3.find(el => 
    el.placeholder?.includes('粘贴') || 
    el.placeholder?.includes('paste')
  );
  await browser({ action: 'act', profile: 'chrome', request: { kind: 'type', ref: urlInput.ref, text: paperUrl } });
  
  // Click Insert
  const insertBtn = snapshot3.find(el => 
    el.text?.includes('插入') || 
    el.text?.includes('Insert')
  );
  await browser({ action: 'act', profile: 'chrome', request: { kind: 'click', ref: insertBtn.ref } });
  
  // Step 3: Generate content
  console.log('🎨 Generating content...');
  await sleep(2000);
  
  const snapshot4 = await browser({ action: 'snapshot', profile: 'chrome', compact: true });
  
  // Generate video
  const videoBtn = snapshot4.find(el => 
    el.text?.includes('视频概览') || 
    el.text?.includes('Video')
  );
  if (videoBtn) {
    await browser({ action: 'act', profile: 'chrome', request: { kind: 'click', ref: videoBtn.ref } });
    console.log('✅ Video generation started');
  }
  
  // Generate infographic
  const infoBtn = snapshot4.find(el => 
    el.text?.includes('信息图') || 
    el.text?.includes('Infographic')
  );
  if (infoBtn) {
    await browser({ action: 'act', profile: 'chrome', request: { kind: 'click', ref: infoBtn.ref } });
    console.log('✅ Infographic generation started');
  }
  
  // Generate presentation
  const presBtn = snapshot4.find(el => 
    el.text?.includes('演示文稿') || 
    el.text?.includes('Presentation')
  );
  if (presBtn) {
    await browser({ action: 'act', profile: 'chrome', request: { kind: 'click', ref: presBtn.ref } });
    console.log('✅ Presentation generation started');
  }
  
  console.log('\n✅ Automation complete! Check Chrome window for progress.');
}

// Run
automateNotebookLM('https://arxiv.org/pdf/2601.22156v1');
```

## Tips

1. **Always use `compact=true`** in snapshots to reduce token usage
2. **Check element refs dynamically** - they change between pages
3. **Add sleep delays** between actions for page transitions
4. **Monitor with periodic snapshots** during long operations
5. **Use both Chinese and English text** for robust selectors

## Resources

- OpenClaw Browser Docs: https://docs.openclaw.ai/tools/browser
- Chrome Extension Docs: https://docs.openclaw.ai/tools/chrome-extension
- NotebookLM: https://notebooklm.google.com
