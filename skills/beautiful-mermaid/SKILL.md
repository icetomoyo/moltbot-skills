---
name: beautiful-mermaid
description: Render Mermaid diagrams as beautiful SVGs or ASCII art. Use when users want to create, visualize, or convert Mermaid diagrams to professional-looking graphics or terminal-friendly ASCII output. Supports 5 diagram types (flowcharts, state, sequence, class, ER diagrams) with 15 built-in themes and full theme customization.
---

# Beautiful Mermaid

Render Mermaid diagrams as beautiful SVGs or ASCII art.

## Overview

This skill provides automated Mermaid diagram rendering with:
- **Auto-installation** - Dependencies are installed automatically on first use
- **SVG output** - Professional, themeable vector graphics
- **ASCII output** - Terminal-friendly text diagrams
- **5 diagram types** - Flowcharts, State, Sequence, Class, ER diagrams

## Usage

### Quick Render

Use the render script to generate diagrams:

```bash
# Render diagram to SVG (default: tokyo-night theme)
echo 'graph TD; A[Start] --> B[End]' | node scripts/render.js

# Render to ASCII
echo 'graph TD; A --> B' | node scripts/render.js -f ascii

# Use different theme
echo 'graph TD; A --> B' | node scripts/render.js -t dracula

# Custom colors
echo 'graph TD; A --> B' | node scripts/render.js --bg "#1a1b26" --fg "#a9b1d6"

# Transparent background
echo 'graph TD; A --> B' | node scripts/render.js --transparent
```

### Diagram Types

**Flowchart** (Top-Down)
```
graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Process]
  B -->|No| D[End]
```

**Flowchart** (Left-Right)
```
graph LR
  A[Input] --> B[Process] --> C[Output]
```

**State Diagram**
```
stateDiagram-v2
  [*] --> Idle
  Idle --> Processing: start
  Processing --> Complete: done
  Complete --> [*]
```

**Sequence Diagram**
```
sequenceDiagram
  Alice->>Bob: Hello!
  Bob-->>Alice: Hi!
  Alice->>Bob: How are you?
```

**Class Diagram**
```
classDiagram
  Animal <|-- Duck
  Animal: +int age
  Duck: +String beakColor
  Duck: +swim()
```

**ER Diagram**
```
erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  PRODUCT ||--o{ LINE_ITEM : "is in"
```

## Available Themes

| Theme | Type | Best For |
|-------|------|----------|
| `zinc-light` | Light | Clean documentation |
| `zinc-dark` | Dark | Dark mode docs |
| `tokyo-night` | Dark | Modern interfaces (default) |
| `tokyo-night-storm` | Dark | Deeper contrast |
| `catppuccin-mocha` | Dark | Warm aesthetic |
| `catppuccin-latte` | Light | Warm light mode |
| `nord` | Dark | Arctic colors |
| `dracula` | Dark | Classic dark |
| `github-light` | Light | GitHub docs |
| `github-dark` | Dark | GitHub dark mode |
| `solarized-light` | Light | Solarized users |
| `solarized-dark` | Dark | Solarized users |
| `one-dark` | Dark | Atom editor fans |

List all themes:
```bash
node scripts/render.js --list-themes
```

## CLI Options

```
-f, --format <svg|ascii>  Output format (default: svg)
-t, --theme <name>        Theme name (default: tokyo-night)
--bg <color>              Background color (hex)
--fg <color>              Foreground color (hex)
--transparent             Transparent background
--list-themes             Output available themes as JSON
```

## Resources

### scripts/
- `render.js` - Main render script with auto-dependency installation

## Notes

- Dependencies are automatically installed on first run
- All colors use CSS custom properties for live theme switching
- ASCII mode uses Unicode box-drawing characters by default
- SVG output can be saved to file using shell redirection: `> output.svg`
