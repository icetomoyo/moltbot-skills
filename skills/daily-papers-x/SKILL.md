---
name: daily-papers-x
description: Automatically fetch and summarize trending AI, Embodied AI, Robotics papers from arXiv and Hugging Face. Generates daily reports with featured paper selections (most interesting, popular, deep, valuable). Use when users want to track latest AI research, create daily paper digests, or monitor research trends.
homepage: https://arxiv.org/
metadata: {"moltbot":{"emoji":"📚","requires":{"bins":["node"]},"install":[{"id":"npm","kind":"npm","package":"axios","bins":["node"],"label":"Auto-installs axios on first run"}]}}
---

# Daily Papers X

Fetch trending AI papers and generate daily reports with featured selections.

## Quick Start

```bash
# Run once
node scripts/fetch-papers.js

# Output
# - Full report: memory/papers-YYYY-MM-DD.md
# - WhatsApp summary: memory/papers-YYYY-MM-DD-summary.txt
```

## Research Categories

- **AI/ML**: cs.AI, cs.LG, cs.CL (max 5 papers)
- **Robotics/Embodied AI**: cs.RO (max 5 papers)
- **AI + Economy/Finance**: cs.AI, q-fin.* (max 4 papers)
- **AI + Biomedical/Medicine**: cs.AI, cs.CV, q-bio.* (max 5 papers)

## Featured Papers

Auto-selected by algorithm:
- 🎨 **Most Interesting**: Novel ideas, breakthrough concepts
- 🔥 **Most Popular**: Highest engagement/likes
- 🧠 **Most Deep**: Theoretical depth, frameworks
- 💎 **Most Valuable**: Real-world applications

## Data Sources

- arXiv API (cs.AI, cs.RO, cs.LG, cs.CL, q-fin, q-bio)
- Hugging Face Daily Papers API

## Automation

Set up cron for daily 8 AM:
```bash
0 8 * * * cd /path/to/clawd && node skills/daily-papers-x/scripts/fetch-papers.js
```

## Notes

- Filters papers from last 24 hours
- Deduplicates by title
- Auto-installs axios dependency on first run
- Generates both full markdown and WhatsApp-friendly summary
