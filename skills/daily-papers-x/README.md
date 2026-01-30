# Daily Papers X

Automatically fetch and summarize trending AI, Embodied AI, and Robotics papers.

## Features

- 🔍 **Multi-source search**: arXiv, Papers With Code, Hugging Face
- 🎯 **Smart filtering**: AI, Robotics, Embodied AI, World Models, LLMs
- 📝 **Detailed reports**: Titles, authors, abstracts, links
- 📊 **Engagement metrics**: Track trending papers
- ⏰ **Automation ready**: Set up daily cron jobs

## Installation

```bash
# Copy to your Moltbot skills directory
cp -r daily-papers-x /path/to/your/clawd/skills/
```

## Usage

### Manual run

```bash
cd skills/daily-papers-x
node scripts/fetch-papers.js
```

### Output

Report saved to: `memory/papers-YYYY-MM-DD.md`

### Example output

```
✅ Report generated successfully!
📄 File: /Users/icetomoyo/clawd/memory/papers-2026-01-30.md
📊 Papers: 15

Top papers:
1. Genie 3: A New Frontier for World Models...
2. Embodied AI with Large Language Models...
3. Robotics Transformer 2: Vision-Language...
```

## Automation

### Daily at 9 AM

```bash
# Edit crontab
crontab -e

# Add this line
0 9 * * * cd /Users/icetomoyo/clawd/skills/daily-papers-x && node scripts/fetch-papers.js
```

### With notification

```bash
# Run and send notification to WhatsApp
node scripts/fetch-papers.js && moltbot message send --to +YOUR_NUMBER --message "📚 Daily papers report ready!"
```

## Data Sources

| Source | Content | Update Frequency |
|--------|---------|------------------|
| arXiv | cs.AI, cs.RO, cs.LG, cs.CV | Real-time |
| Papers With Code | Trending with code | Daily |
| Hugging Face | Community papers | Daily |

## Customization

Edit `scripts/fetch-papers.js`:

```javascript
const CONFIG = {
  keywords: ['your', 'keywords', 'here'],
  hoursBack: 24,
  maxResults: 20
};
```

## Requirements

- Node.js 18+
- Internet connection
- (Auto-installs axios on first run)

## License

MIT
