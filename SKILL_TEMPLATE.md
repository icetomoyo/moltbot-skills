# Skill Template

Use this template to create new OpenClaw skills.

## Quick Start

```bash
# Run the skill creator script
python3 /path/to/openclaw/skills/skill-creator/scripts/init_skill.py my-skill --path ./skills
```

## Skill Structure

```
my-skill/
├── SKILL.md          # Required - Skill documentation for the agent
├── README.md         # Recommended - User-facing documentation
├── LICENSE           # Recommended - License file
├── .gitignore        # Recommended - Git ignore rules
└── scripts/          # Optional - Scripts and tools
    └── tool.py
```

## SKILL.md Template

```markdown
---
name: my-skill
description: Brief description of what this skill does and when to use it. Be specific about triggers and use cases.
---

# My Skill

## Overview

What this skill enables and why it's useful.

## Quick Start

### Basic Usage

```bash
# Example commands
```

## Features

- Feature 1
- Feature 2
- Feature 3

## Configuration

If applicable, configuration options.

## Resources

### scripts/
- `tool.py` - Description of what this script does

## Notes

Any important notes or limitations.
```

## Best Practices

1. **SKILL.md frontmatter** is required - it tells the agent when to use this skill
2. **Keep it concise** - Skills share context window, so be brief
3. **Auto-install dependencies** - Use scripts that install deps on first run
4. **Test thoroughly** - Run your scripts before committing
5. **Document clearly** - Both SKILL.md (for agents) and README.md (for users)

## Publishing

```bash
# Package the skill
python3 /path/to/openclaw/skills/skill-creator/scripts/package_skill.py ./skills/my-skill ./releases

# Or use our publish script
./scripts/publish-skill.sh my-skill
```

## Example Skills

See `skills/beautiful-mermaid/` for a complete example.
