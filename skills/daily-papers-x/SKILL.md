---
name: daily-papers-x
description: Automatically fetch and summarize trending AI, Embodied AI, and Robotics papers from multiple sources (arXiv, Papers With Code, Hugging Face) and generate a detailed Markdown report. Use when users want to track latest research papers, create daily paper digests, or monitor AI research trends.
---

# Daily Papers from X

Fetch trending AI research papers and generate comprehensive daily reports.

## Overview

This skill searches multiple academic sources for the latest AI, Embodied AI, Robotics, and LLM papers published in the last 24 hours, then generates a detailed Markdown report with summaries and links.

## Data Sources

- **arXiv** - cs.AI, cs.RO, cs.LG, cs.CV categories
- **Papers With Code** - Trending papers with code
- **Hugging Face Daily Papers** - Community curated papers

## Search Focus

- AI (Artificial Intelligence)
- Embodied AI
- Robotics
- World Models
- LLMs (Large Language Models)
- Simulation Learning
- Generative AI

## Usage

### Run once (manual)

```bash
node scripts/fetch-papers.js
```

### Output

Generates a Markdown file in `memory/papers-YYYY-MM-DD.md` with:
- Paper title and authors
- Abstract/summary
- Direct links to paper (PDF, arXiv, etc.)
- Engagement metrics (when available)
- Publication date and source

### Example Output Structure

```markdown
# Daily AI Papers - 2026-01-30

## 1. Paper Title
**Authors**: Author Name, et al.  
**Source**: arXiv  
**Category**: cs.AI

### Abstract
[Paper abstract summary...]

### Links
- [Paper URL](https://arxiv.org/abs/...)
- [PDF](https://arxiv.org/pdf/...)

---
```

## Automation Setup

### Daily cron job

```bash
# Add to crontab (runs daily at 9 AM)
0 9 * * * cd /Users/icetomoyo/clawd/skills/daily-papers-x && node scripts/fetch-papers.js
```

### Using Moltbot cron

```bash
moltbot cron add --name "daily-papers" --schedule "0 9 * * *" --command "node skills/daily-papers-x/scripts/fetch-papers.js"
```

## Configuration

Edit `scripts/fetch-papers.js` to customize:

- `CONFIG.keywords` - Search terms
- `CONFIG.hoursBack` - Lookback period (default: 24)
- `CONFIG.maxResults` - Maximum papers per source (default: 20)
- `CONFIG.minEngagement` - Minimum popularity threshold

## Resources

### scripts/
- `fetch-papers.js` - Main script to fetch and generate reports

## Notes

- Automatically installs dependencies (axios) on first run
- Creates `memory/` directory if it doesn't exist
- Falls back gracefully if any source is unavailable
- Designed to be run via cron for daily automation
