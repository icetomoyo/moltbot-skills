---
name: notebooklm-automation
description: Automate NotebookLM workflow - create notebook, add paper URL as source, and generate video, infographic, and presentation. Use when users want to process research papers through Google's NotebookLM to automatically generate multimedia content.
homepage: https://notebooklm.google.com
metadata: {"moltbot":{"emoji":"🤖","requires":{"bins":["node"]},"install":[{"id":"npm","kind":"npm","package":"playwright-core","bins":["node"],"label":"Auto-installs Playwright on first run"}]}}
---

# NotebookLM Automation

Automate the complete NotebookLM workflow for processing research papers.

## What it does

1. Opens NotebookLM (uses your logged-in Chrome session)
2. Creates a new notebook
3. Adds your paper URL as a website source
4. Waits for NotebookLM to process the content
5. Automatically clicks:
   - 🎬 Generate Video
   - 📊 Generate Infographic  
   - 📽️ Generate Presentation
6. Downloads all generated content

## Prerequisites

- Chrome must be logged into your Google account
- NotebookLM must be accessible (notebooklm.google.com)
- Chrome should remain open during automation

## Usage

```bash
# With paper URL as argument
node scripts/automate-notebooklm.js "https://arxiv.org/abs/2601.22159"

# With environment variable
PAPER_URL="https://arxiv.org/abs/2601.22159" node scripts/automate-notebooklm.js
```

## Output

Generated content is saved to:
```
workspace/content/notebooklm-output/
├── video-xxx.mp4
├── infographic-xxx.png
└── presentation-xxx.pptx
```

## Process Time

- Adding source: 1-3 minutes (for NotebookLM to process)
- Generating content: 2-5 minutes
- Total: ~5-8 minutes per paper

## Notes

- Browser window will be visible during automation
- Script waits for processing to complete
- Downloads are automatic when available
- Browser closes automatically after completion
- On error, browser stays open for debugging (1 minute)

## Troubleshooting

If NotebookLM interface changes:
- Script uses multiple selector strategies
- Check console output for specific errors
- Update selectors in script if needed
