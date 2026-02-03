# OpenClaw Skills Collection

A curated collection of custom skills for OpenClaw - AI automation, monitoring, and productivity tools.

## 🚀 Featured Skills

### AI Trend Monitor
Unified AI trend monitoring across multiple sources - arXiv, Hugging Face, Reddit, Hacker News, GitHub, and Nitter.

- **Path**: `skills/ai-trend-monitor/`
- **Features**: 
  - 6 data sources (arXiv, HuggingFace, Reddit, HN, GitHub, Nitter)
  - Dynamic hot topics from hot-topic-vocabulary skill
  - 7-day freshness filtering
  - Balanced scoring across platforms
  - WhatsApp summaries with TOP 10 trends
- **Status**: ✅ Ready

### AI Trend Analyzer
Deep analysis of AI trend monitoring results. Generates comprehensive markdown reports with insights and predictions.

- **Path**: `skills/ai-trend-analyzer/`
- **Features**:
  - Parses data from ai-trend-monitor
  - Deep analysis of each hotspot
  - Overall trend identification
  - Professional markdown reports
  - Auto-sync to user folder
- **Status**: ✅ Ready

### Daily Papers X
Automatically fetch and summarize trending AI papers from arXiv and Hugging Face with enhanced selection strategy.

- **Path**: `skills/daily-papers-x/`
- **Features**:
  - Top 20 selection with category enforcement (5 AI&LLM + 5 Embodied AI min)
  - 30 arXiv categories across 6 research directions
  - 1 Top Pick + 4 Featured papers for WhatsApp
  - Full markdown report with all 20 papers
  - Auto-sync to user folder
- **Status**: ✅ Ready

### Hot Topic Vocabulary
Dynamic hot topic vocabulary analyzer - updates daily with emerging AI/tech keywords.

- **Path**: `skills/hot-topic-vocabulary/`
- **Features**:
  - NLP-based keyword extraction
  - 10-category classification
  - Auto-updates AI Trend Monitor
  - Cron-scheduled runs (daily at 12:00)
- **Status**: ✅ Ready

### Beautiful Mermaid
Render Mermaid diagrams as beautiful SVGs or ASCII art.

- **Path**: `skills/beautiful-mermaid/`
- **Features**: 15+ themes, SVG/ASCII output, auto-installation
- **Status**: ✅ Ready

### Agent Browser
A fast Rust-based headless browser automation CLI for web scraping and automation.

- **Path**: `skills/agent-browser/`
- **Features**: 
  - Rust-based headless browser
  - Navigate, click, type, snapshot
  - Structured command interface
- **Status**: ✅ Ready

## 📦 Installation

### Method 1: Clone Repository
```bash
git clone https://github.com/icetomoyo/openclaw-skills.git
cd openclaw-skills
```

### Method 2: Install Individual Skills
```bash
# Copy skill to your OpenClaw skills directory
cp -r skills/ai-trend-monitor /path/to/your/clawd/skills/
cp -r skills/daily-papers-x /path/to/your/clawd/skills/
```

## 🛠️ Creating New Skills

See [SKILL_TEMPLATE.md](SKILL_TEMPLATE.md) for creating your own skills.

## 📁 Project Structure

```
openclaw-skills/
├── skills/                       # All skills
│   ├── ai-trend-monitor/        # AI trend monitoring (6 sources)
│   ├── ai-trend-analyzer/       # Deep trend analysis & reports
│   ├── daily-papers-x/          # AI papers curator
│   ├── hot-topic-vocabulary/    # Dynamic vocabulary
│   ├── beautiful-mermaid/       # Diagram renderer
│   └── agent-browser/           # Browser automation
├── releases/                     # Packaged .skill files
├── .gitignore                    # Privacy protection
└── README.md                     # This file
```

## 🔒 Privacy & Security

- **Chrome profiles**: `.chrome-profile*` directories are excluded from git
- **Credentials**: All tokens, keys, and secrets are gitignored
- **Local data**: Output files and cache are not synced
- **Sync folder**: Reports auto-sync to `/Users/icetomoyo/Downloads/同步空间/Dir4Openclaw/`

See `.gitignore` for full list of excluded files.

## 📊 Skills Workflow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Hot Topic          │────▶│  AI Trend Monitor   │────▶│  AI Trend Analyzer  │
│  Vocabulary         │     │  (6 data sources)   │     │  (Deep analysis)    │
│  (Daily 12:00)      │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                                                                  │
                                                                  ▼
                                                    ┌─────────────────────┐
                                                    │  Sync to user folder │
                                                    │  + WhatsApp summary  │
                                                    └─────────────────────┘

┌─────────────────────┐
│  Daily Papers X     │────▶ WhatsApp (Top Pick + 4 Featured)
│  (Daily 12:00)      │────▶ Full MD report (20 papers)
└─────────────────────┘
```

## 🤝 Contributing

1. Create a new skill in `skills/<skill-name>/`
2. Include `SKILL.md` with proper frontmatter
3. Add user documentation in `README.md`
4. Test thoroughly
5. Submit PR

## 📄 License

MIT - See [LICENSE](LICENSE) for details.

---

**Note**: This is a personal skill collection. Skills are tested and maintained for personal use.
