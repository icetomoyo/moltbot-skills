# Pi Coding Agent - Python Implementation

A complete Python implementation of Pi Coding Agent, inspired by [badlogic/pi-mono](https://github.com/badlogic/pi-mono/).

## Features

### Core Philosophy
- **Minimal Core**: Only 4 tools (Read, Write, Edit, Bash)
- **Tree-Structured Sessions**: Branch, rewind, parallel workflows
- **Self-Extension**: Agent writes its own extensions, no MCP needed
- **Hot Reload**: Extensions can be modified and reloaded at runtime
- **State Persistence**: Extension state saved with session

### Architecture

```
pi_agent.py
├── Session (Tree Structure)
│   ├── SessionNode (messages, extension_state)
│   ├── Branching & Rewinding
│   └── Path to Root (message history)
├── Tools (4 core tools)
│   ├── read(path, offset, limit)
│   ├── write(path, content)
│   ├── edit(path, old_string, new_string)
│   └── bash(command, cwd)
├── Extension System
│   ├── Base Extension class
│   ├── State persistence
│   └── Hot reload support
└── Commands (/help, /branch, /rewind, etc.)
```

## Installation

```bash
# Clone or download pi_agent.py
mkdir pi-agent
cd pi-agent
python3 -m venv venv
source venv/bin/activate

# No dependencies needed for core!
# For LLM integration, install your preferred provider:
pip install openai  # or anthropic, etc.
```

## Usage

### Start the Agent

```bash
python pi_agent.py
```

### Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/new [name]` | Create new session |
| `/save` | Save current session |
| `/load <id>` | Load a session |
| `/list` | List all sessions |
| `/branch` | Create branch from current node |
| `/rewind <node_id>` | Rewind to specific node |
| `/tree` | Show session tree |
| `/summary` | Show session summary |

### Tree-Structured Sessions

```
## Session Tree
└── a1b2c3d4
    ├── e5f6g7h8
    │   └── i9j0k1l2 (current)
    └── m3n4o5p6
```

**Branching**: Create parallel exploration paths  
**Rewinding**: Go back to any point in history  
**Merging**: Bring insights from branches back to main

### Extensions

Extensions can:
- Register custom slash commands
- Persist state to session
- Add TUI components
- Intercept tool calls

Example built-in extension: `/todos` - manage to-do items

## Creating Your Own LLM Integration

Replace `MockLLM` with real LLM:

```python
import openai

class OpenAILLM(LLMInterface):
    def __init__(self, api_key):
        self.client = openai.OpenAI(api_key=api_key)
    
    def generate(self, messages, tools):
        # Convert messages to OpenAI format
        openai_messages = [
            {"role": m.role, "content": m.content}
            for m in messages
        ]
        
        # Add tool descriptions to system prompt
        tools_desc = self._format_tools(tools)
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=openai_messages,
            temperature=0.7
        )
        
        return response.choices[0].message.content
```

## Example Session

```
🥧 pi> Create a Python script that calculates fibonacci numbers

I'll create a fibonacci calculator for you:

<tool>write</tool>
<params>
<path>fib.py</path>
<content>
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

if __name__ == "__main__":
    for i in range(10):
        print(f"fib({i}) = {fibonacci(i)}")
</content>
</params>

File created! Let's run it:

<tool>bash</tool>
<params>
<command>python fib.py</command>
</params>

fib(0) = 0
fib(1) = 1
fib(2) = 1
fib(3) = 2
...

🥧 pi> /branch
Created branch: x9y8z7w6

🥧 pi> Now optimize it with memoization
...

🥧 pi> /tree
## Session Tree
└── a1b2c3d4
    ├── x9y8z7w6 (current) - with memoization
    └── q1w2e3r4 - original recursive
```

## Project Structure

```
pi-agent/
├── pi_agent.py          # Main implementation
├── skills/              # Agent skills (markdown + code)
│   └── web-browser/
│       └── SKILL.md
├── extensions/          # Custom extensions
│   └── custom_ext.py
└── .pi/
    ├── sessions/        # Saved sessions
    └── todos/          # To-do items
```

## Design Principles

1. **Minimal Core**: 4 tools are enough for any task
2. **Code Writes Code**: Agent extends itself, no external dependencies
3. **Tree Not Line**: Sessions branch and merge like git
4. **State Persists**: Extensions save state, survive restarts
5. **Hot Reload**: Change code, reload, continue

## Comparison with Original Pi

| Feature | Original Pi (TS) | This Implementation |
|---------|------------------|---------------------|
| Core Tools | 4 | 4 |
| Tree Sessions | ✅ | ✅ |
| Extensions | ✅ | ✅ |
| Hot Reload | ✅ | ✅ (via module reload) |
| TUI | Rich TUI | Simple CLI (extensible) |
| MCP Support | Via mcporter | Same approach possible |

## Roadmap

- [ ] Rich TUI with textual
- [ ] Multiple LLM provider support
- [ ] Extension marketplace (git-based)
- [ ] Session sharing format
- [ ] Review mode (/review command)
- [ ] Sub-agent support

## Credits

- Original Pi by [Mario Zechner](https://mariozechner.at/)
- Article by [Armin Ronacher](https://lucumr.pocoo.org/)
- OpenClaw by [Peter](https://openclaw.ai/)

## License

MIT - See original Pi project for its license.
