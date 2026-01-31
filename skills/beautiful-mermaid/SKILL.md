---
name: beautiful-mermaid
description: Render Mermaid diagrams as beautiful SVGs or ASCII art. Use when users want to create, visualize, or convert Mermaid diagrams to professional-looking graphics or terminal-friendly ASCII output. Supports flowcharts, state, sequence, class, ER diagrams with 15+ themes.
homepage: https://github.com/lukilabs/beautiful-mermaid
metadata: {"openclaw":{"emoji":"🧜","requires":{"bins":["node"]},"install":[{"id":"npm","kind":"npm","package":"beautiful-mermaid","bins":["node"],"label":"Auto-installs on first run"}]}}
---

# Beautiful Mermaid

Render Mermaid diagrams to SVG or ASCII using beautiful-mermaid library.

## Quick Start

```bash
# SVG output (default: tokyo-night theme)
echo 'graph TD; A --> B' | node scripts/render.js

# ASCII output
echo 'graph TD; A --> B' | node scripts/render.js -f ascii

# List themes
node scripts/render.js --list-themes
```

## Supported Diagrams

- Flowcharts (TD, LR, BT, RL)
- State diagrams
- Sequence diagrams
- Class diagrams
- ER diagrams

## CLI Options

```
-f, --format <svg|ascii>  Output format (default: svg)
-t, --theme <name>        Theme name (default: tokyo-night)
--bg <color>              Background color (hex)
--fg <color>              Foreground color (hex)
--transparent             Transparent background
--list-themes             List available themes
```

## Themes

Built-in: tokyo-night, dracula, catppuccin-mocha, nord, github-dark, solarized-dark, etc.

## Notes

- Auto-installs beautiful-mermaid npm package on first run
- Zero DOM dependencies, works in any Node.js environment
