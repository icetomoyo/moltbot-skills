# OpenClaw Skills Collection

A curated collection of custom skills for OpenClaw - AI automation, monitoring, and productivity tools.

## 🚀 Featured Skills

### AI Trend Monitor
Unified AI trend monitoring across multiple sources - arXiv, Hugging Face, Reddit, Hacker News, and Nitter.

- **Path**: `skills/ai-trend-monitor/`
- **Features**: 
  - 10 hot topic categories (200+ keywords)
  - Multi-source aggregation
  - Auto-fallback when Reddit is rate-limited
  - WhatsApp summaries with TOP 5 trends
- **Status**: ✅ Ready

### Hot Topic Vocabulary
Dynamic hot topic vocabulary analyzer - updates every 6 hours with emerging AI/tech keywords.

- **Path**: `skills/hot-topic-vocabulary/`
- **Features**:
  - NLP-based keyword extraction
  - 10-category classification
  - Auto-updates AI Trend Monitor
  - Cron-scheduled runs
- **Status**: ✅ Ready

### Daily Papers X
Automatically fetch and summarize trending AI papers with arXiv and Hugging Face integration.

- **Path**: `skills/daily-papers-x/`
- **Features**:
  - Auto-expand search (24h → 48h if needed)
  - 4 research directions: AI/LLM, Embodied AI, AI+Finance, AI+Biomedical
  - WhatsApp summaries
- **Status**: ✅ Ready

### Beautiful Mermaid
Render Mermaid diagrams as beautiful SVGs or ASCII art.

- **Path**: `skills/beautiful-mermaid/`
- **Features**: 15+ themes, SVG/ASCII output, auto-installation
- **Status**: ✅ Ready

## 📦 Installation

### Method 1: Install from GitHub
```bash
# Install specific skill
openclaw skills install https://github.com/icetomoyo/openclaw-skills/tree/main/skills/ai-trend-monitor

# Or download .skill file and install
openclaw skills install ./ai-trend-monitor.skill
```

### Method 2: Manual Copy
```bash
cp -r skills/ai-trend-monitor /path/to/your/clawd/skills/
```

## 🛠️ Creating New Skills

See [SKILL_TEMPLATE.md](SKILL_TEMPLATE.md) for creating your own skills.

## 📁 Project Structure

```
openclaw-skills/
├── skills/                       # All skills
│   ├── ai-trend-monitor/        # AI trend monitoring
│   ├── hot-topic-vocabulary/    # Dynamic vocabulary
│   ├── daily-papers-x/          # Paper fetcher
│   └── beautiful-mermaid/       # Diagram renderer
├── releases/                     # Packaged .skill files
├── .gitignore                    # Privacy protection
└── README.md                     # This file
```

## 🔒 Privacy & Security

- **Chrome profiles**: `.chrome-profile*` directories are excluded from git
- **Credentials**: All tokens, keys, and secrets are gitignored
- **Local data**: Output files and cache are not synced

See `.gitignore` for full list of excluded files.

## 🤝 Contributing

1. Create a new skill in `skills/<skill-name>/`
2. Include `SKILL.md` with proper frontmatter
3. Add user documentation
4. Test thoroughly
5. Submit PR

## 📄 License

MIT - See [LICENSE](LICENSE) for details.

---

**Note**: This is a personal skill collection. Skills are tested and maintained for personal use.
