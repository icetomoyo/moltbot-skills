# Web Browser Skill

## Description

This skill allows the agent to control a web browser using Chrome DevTools Protocol (CDP).
Instead of using external tools or MCPs, the agent writes its own browser automation.

## Capabilities

- Navigate to URLs
- Take screenshots
- Extract page content
- Click elements
- Fill forms
- Execute JavaScript

## Usage

The agent can use this skill by writing Python scripts that use `chrome-cli` or `playwright`:

```python
# Example: Take a screenshot
import subprocess

result = subprocess.run([
    "chrome-cli", "capture",
    "--url", "https://example.com",
    "--output", "screenshot.png"
], capture_output=True, text=True)

print(result.stdout)
```

Or with Playwright:

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://example.com")
    content = page.content()
    browser.close()
    print(content)
```

## Installation

```bash
pip install playwright
playwright install chromium
```

## Why This Approach?

Instead of using MCP (Model Context Protocol) which:
- Requires external servers
- Tools must be loaded into context
- Hard to modify behavior

This skill:
- Is just Python code the agent writes
- Can be modified on the fly
- No external dependencies beyond Python packages
- Agent fully controls the implementation
