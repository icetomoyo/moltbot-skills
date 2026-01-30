# Moltbot Skills Collection

A curated collection of custom skills for Moltbot.

## Skills

### beautiful-mermaid
Render Mermaid diagrams as beautiful SVGs or ASCII art.

- **Path**: `skills/beautiful-mermaid/`
- **Features**: 15+ themes, SVG/ASCII output, auto-installation
- **Status**: ✅ Ready

## Installation

### Method 1: Install from GitHub
```bash
# Install specific skill
moltbot skills install https://github.com/YOUR_USERNAME/moltbot-skills/tree/main/skills/beautiful-mermaid

# Or download .skill file and install
moltbot skills install ./beautiful-mermaid.skill
```

### Method 2: Manual Copy
```bash
cp -r skills/beautiful-mermaid /path/to/your/clawd/skills/
```

## Creating New Skills

See [SKILL_TEMPLATE.md](SKILL_TEMPLATE.md) for creating your own skills.

## Project Structure

```
moltbot-skills/
├── skills/                    # All skills
│   ├── beautiful-mermaid/    # Skill folder
│   │   ├── SKILL.md          # Skill documentation (required)
│   │   ├── README.md         # User-facing docs
│   │   └── scripts/          # Scripts and tools
│   └── ...                   # More skills
├── releases/                  # Packaged .skill files
├── scripts/                   # Build and publish scripts
└── docs/                      # Additional documentation
```

## Contributing

1. Create a new skill in `skills/<skill-name>/`
2. Include `SKILL.md` with proper frontmatter
3. Add `README.md` for users
4. Test thoroughly
5. Submit PR

## License

MIT - See [LICENSE](LICENSE) for details.
