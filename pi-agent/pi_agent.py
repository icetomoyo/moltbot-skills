#!/usr/bin/env python3
"""
Pi Coding Agent - Python Implementation
A minimal agentic coding system inspired by https://github.com/badlogic/pi-mono/

Core features:
- 4 minimal tools: Read, Write, Edit, Bash
- Tree-structured sessions with branching and rewinding
- Extension system with state persistence
- Hot reloading of extensions
- No MCP - agent writes its own extensions
"""

import os
import sys
import json
import subprocess
import hashlib
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field, asdict
from pathlib import Path
import argparse


# =============================================================================
# DATA MODELS
# =============================================================================

@dataclass
class Message:
    """Base message class for session messages"""
    role: str  # 'user', 'assistant', 'system', 'extension'
    content: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return {
            'role': self.role,
            'content': self.content,
            'timestamp': self.timestamp,
            'metadata': self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Message':
        return cls(**data)


@dataclass
class SessionNode:
    """A node in the session tree"""
    id: str
    parent_id: Optional[str]
    messages: List[Message] = field(default_factory=list)
    children: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    extension_state: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'parent_id': self.parent_id,
            'messages': [m.to_dict() for m in self.messages],
            'children': self.children,
            'created_at': self.created_at,
            'extension_state': self.extension_state
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'SessionNode':
        node = cls(
            id=data['id'],
            parent_id=data.get('parent_id'),
            created_at=data['created_at'],
            extension_state=data.get('extension_state', {})
        )
        node.messages = [Message.from_dict(m) for m in data.get('messages', [])]
        node.children = data.get('children', [])
        return node


@dataclass
class Session:
    """A tree-structured session"""
    id: str
    root_id: str
    current_node_id: str
    nodes: Dict[str, SessionNode] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    name: str = "untitled"
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'root_id': self.root_id,
            'current_node_id': self.current_node_id,
            'nodes': {k: v.to_dict() for k, v in self.nodes.items()},
            'created_at': self.created_at,
            'name': self.name
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Session':
        session = cls(
            id=data['id'],
            root_id=data['root_id'],
            current_node_id=data['current_node_id'],
            created_at=data['created_at'],
            name=data.get('name', 'untitled')
        )
        session.nodes = {k: SessionNode.from_dict(v) for k, v in data.get('nodes', {}).items()}
        return session
    
    def current_node(self) -> SessionNode:
        return self.nodes[self.current_node_id]
    
    def add_message(self, message: Message):
        """Add message to current node"""
        self.current_node().messages.append(message)
    
    def branch(self, node_id: Optional[str] = None) -> str:
        """Create a branch from specified node (or current node)"""
        if node_id is None:
            node_id = self.current_node_id
        
        parent = self.nodes[node_id]
        new_node = SessionNode(
            id=str(uuid.uuid4())[:8],
            parent_id=node_id
        )
        # Copy extension state from parent
        new_node.extension_state = parent.extension_state.copy()
        
        self.nodes[new_node.id] = new_node
        parent.children.append(new_node.id)
        self.current_node_id = new_node.id
        return new_node.id
    
    def rewind(self, node_id: str) -> bool:
        """Rewind to a specific node in the tree"""
        if node_id not in self.nodes:
            return False
        self.current_node_id = node_id
        return True
    
    def get_path_to_root(self, node_id: Optional[str] = None) -> List[SessionNode]:
        """Get all messages from root to specified node"""
        if node_id is None:
            node_id = self.current_node_id
        
        path = []
        current = self.nodes.get(node_id)
        while current:
            path.append(current)
            if current.parent_id:
                current = self.nodes.get(current.parent_id)
            else:
                break
        return list(reversed(path))
    
    def get_all_messages(self) -> List[Message]:
        """Get all messages in current branch"""
        messages = []
        for node in self.get_path_to_root():
            messages.extend(node.messages)
        return messages


# =============================================================================
# TOOLS
# =============================================================================

class Tools:
    """The 4 core tools of Pi: Read, Write, Edit, Bash"""
    
    @staticmethod
    def read(path: str, offset: int = 0, limit: Optional[int] = None) -> str:
        """Read file contents"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                if offset > 0:
                    lines = lines[offset:]
                if limit:
                    lines = lines[:limit]
                return ''.join(lines)
        except FileNotFoundError:
            return f"Error: File not found: {path}"
        except Exception as e:
            return f"Error reading {path}: {str(e)}"
    
    @staticmethod
    def write(path: str, content: str) -> str:
        """Write content to file (creates if not exists)"""
        try:
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return f"Successfully wrote to {path}"
        except Exception as e:
            return f"Error writing to {path}: {str(e)}"
    
    @staticmethod
    def edit(path: str, old_string: str, new_string: str) -> str:
        """Edit file by replacing old_string with new_string"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if old_string not in content:
                return f"Error: old_string not found in {path}"
            
            new_content = content.replace(old_string, new_string, 1)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            return f"Successfully edited {path}"
        except FileNotFoundError:
            return f"Error: File not found: {path}"
        except Exception as e:
            return f"Error editing {path}: {str(e)}"
    
    @staticmethod
    def bash(command: str, cwd: Optional[str] = None) -> str:
        """Execute bash command"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=300
            )
            output = result.stdout
            if result.stderr:
                output += f"\n[stderr]:\n{result.stderr}"
            if result.returncode != 0:
                output += f"\n[exit code: {result.returncode}]"
            return output
        except subprocess.TimeoutExpired:
            return "Error: Command timed out after 300 seconds"
        except Exception as e:
            return f"Error executing command: {str(e)}"


# =============================================================================
# EXTENSION SYSTEM
# =============================================================================

class Extension:
    """Base class for Pi extensions"""
    name: str = "base"
    description: str = "Base extension"
    
    def __init__(self, agent: 'PiAgent'):
        self.agent = agent
    
    def register(self):
        """Register extension with the agent"""
        pass
    
    def get_state(self) -> Dict[str, Any]:
        """Get extension state for persistence"""
        return {}
    
    def set_state(self, state: Dict[str, Any]):
        """Restore extension state"""
        pass


class TodosExtension(Extension):
    """Example extension: To-do list management"""
    name = "todos"
    description = "Manage to-do items"
    
    def __init__(self, agent: 'PiAgent'):
        super().__init__(agent)
        self.todos_dir = Path.home() / ".pi" / "todos"
        self.todos_dir.mkdir(parents=True, exist_ok=True)
    
    def list_todos(self) -> str:
        """List all to-do items"""
        todos = list(self.todos_dir.glob("*.md"))
        if not todos:
            return "No todos found"
        
        result = ["## To-Do Items"]
        for todo_file in sorted(todos):
            content = todo_file.read_text()
            title = content.split('\n')[0] if content else todo_file.stem
            status = "✅" if "[x]" in content else "⬜"
            result.append(f"{status} {todo_file.stem}: {title}")
        return '\n'.join(result)
    
    def create_todo(self, name: str, content: str = "") -> str:
        """Create a new to-do"""
        todo_file = self.todos_dir / f"{name}.md"
        todo_file.write_text(content or f"# {name}\n\n- [ ] Task 1\n")
        return f"Created todo: {name}"
    
    def register(self):
        """Register commands"""
        self.agent.register_command("/todos", self.list_todos, "List all todos")
        self.agent.register_command("/todo-new", self.create_todo, "Create new todo")


# =============================================================================
# LLM INTERFACE
# =============================================================================

class LLMInterface:
    """Abstract interface for LLM providers"""
    
    def generate(self, messages: List[Message], tools: Dict[str, Callable]) -> str:
        """Generate response from LLM"""
        raise NotImplementedError


class MockLLM(LLMInterface):
    """Mock LLM for testing - in real implementation, use OpenAI, Anthropic, etc."""
    
    def generate(self, messages: List[Message], tools: Dict[str, Callable]) -> str:
        """Simple mock that suggests tool calls based on user input"""
        last_message = messages[-1].content if messages else ""
        
        # Simple pattern matching for demo
        if "read" in last_message.lower() or "show" in last_message.lower():
            return """I'll help you read that file. Let me use the read tool:

<tool>read</tool>
<params>
<path>Please provide the file path</path>
</params>

What file would you like me to read?"""
        
        elif "write" in last_message.lower() or "create" in last_message.lower():
            return """I can help you create a file. I'll use the write tool:

<tool>write</tool>
<params>
<path>Please provide the file path</path>
<content>Please provide the content</content>
</params>

What would you like to write?"""
        
        elif "run" in last_message.lower() or "execute" in last_message.lower():
            return """I'll execute that command for you:

<tool>bash</tool>
<params>
<command>Please provide the command</command>
</params>

What command should I run?"""
        
        return """I can help you with various tasks using my tools:

- **read** - Read file contents
- **write** - Write to files
- **edit** - Edit files by replacing text
- **bash** - Execute shell commands

What would you like to do? Type a message and I can suggest the appropriate tool."""


# =============================================================================
# MAIN AGENT
# =============================================================================

class PiAgent:
    """
    Main Pi Agent - Minimal coding agent with tree-structured sessions
    """
    
    def __init__(self, workspace: str = ".", sessions_dir: str = ".pi/sessions"):
        self.workspace = Path(workspace).resolve()
        self.sessions_dir = Path(sessions_dir)
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        
        self.tools = {
            'read': Tools.read,
            'write': Tools.write,
            'edit': Tools.edit,
            'bash': Tools.bash
        }
        
        self.commands: Dict[str, tuple] = {}  # name -> (handler, description)
        self.extensions: List[Extension] = []
        self.llm: LLMInterface = MockLLM()
        
        self.current_session: Optional[Session] = None
        
        # Register built-in commands
        self._register_builtin_commands()
        
        # Load extensions
        self._load_extensions()
    
    def _register_builtin_commands(self):
        """Register built-in slash commands"""
        self.register_command("/help", self.cmd_help, "Show help")
        self.register_command("/new", self.cmd_new_session, "Create new session")
        self.register_command("/save", self.cmd_save_session, "Save current session")
        self.register_command("/load", self.cmd_load_session, "Load a session")
        self.register_command("/list", self.cmd_list_sessions, "List all sessions")
        self.register_command("/branch", self.cmd_branch, "Create a branch")
        self.register_command("/rewind", self.cmd_rewind, "Rewind to a node")
        self.register_command("/tree", self.cmd_show_tree, "Show session tree")
        self.register_command("/summary", self.cmd_summary, "Show session summary")
    
    def register_command(self, name: str, handler: Callable, description: str):
        """Register a slash command"""
        self.commands[name] = (handler, description)
    
    def _load_extensions(self):
        """Load and register extensions"""
        # Load built-in extensions
        todos = TodosExtension(self)
        todos.register()
        self.extensions.append(todos)
        
        # Restore extension state if session exists
        if self.current_session:
            state = self.current_session.current_node().extension_state
            for ext in self.extensions:
                ext_name = ext.name
                if ext_name in state:
                    ext.set_state(state[ext_name])
    
    def create_session(self, name: str = "untitled") -> Session:
        """Create a new session"""
        root_id = str(uuid.uuid4())[:8]
        session = Session(
            id=str(uuid.uuid4())[:8],
            root_id=root_id,
            current_node_id=root_id,
            name=name
        )
        session.nodes[root_id] = SessionNode(id=root_id, parent_id=None)
        self.current_session = session
        return session
    
    def save_session(self, session: Optional[Session] = None):
        """Save session to disk"""
        if session is None:
            session = self.current_session
        if session is None:
            return "No active session"
        
        # Save extension state
        for ext in self.extensions:
            session.current_node().extension_state[ext.name] = ext.get_state()
        
        session_file = self.sessions_dir / f"{session.id}.json"
        with open(session_file, 'w') as f:
            json.dump(session.to_dict(), f, indent=2)
        
        return f"Session saved: {session.id}"
    
    def load_session(self, session_id: str) -> Optional[Session]:
        """Load session from disk"""
        session_file = self.sessions_dir / f"{session_id}.json"
        if not session_file.exists():
            return None
        
        with open(session_file, 'r') as f:
            data = json.load(f)
        
        self.current_session = Session.from_dict(data)
        
        # Restore extension state
        state = self.current_session.current_node().extension_state
        for ext in self.extensions:
            ext_name = ext.name
            if ext_name in state:
                ext.set_state(state[ext_name])
        
        return self.current_session
    
    def process_message(self, content: str) -> str:
        """Process user message"""
        if not self.current_session:
            self.create_session()
        
        # Check for slash commands
        if content.startswith('/'):
            parts = content.split(maxsplit=1)
            cmd_name = parts[0]
            args = parts[1] if len(parts) > 1 else ""
            
            if cmd_name in self.commands:
                handler, _ = self.commands[cmd_name]
                try:
                    return handler(args)
                except Exception as e:
                    return f"Error executing {cmd_name}: {str(e)}"
            else:
                return f"Unknown command: {cmd_name}. Type /help for available commands."
        
        # Add user message to session
        self.current_session.add_message(Message(role='user', content=content))
        
        # Generate response from LLM
        messages = self.current_session.get_all_messages()
        response = self.llm.generate(messages, self.tools)
        
        # Add assistant message to session
        self.current_session.add_message(Message(role='assistant', content=response))
        
        return response
    
    def execute_tool(self, tool_name: str, **params) -> str:
        """Execute a tool"""
        if tool_name not in self.tools:
            return f"Unknown tool: {tool_name}"
        
        try:
            result = self.tools[tool_name](**params)
            
            # Record tool execution in session
            if self.current_session:
                tool_msg = Message(
                    role='extension',
                    content=f"Tool: {tool_name}\nParams: {params}\nResult: {result[:500]}...",
                    metadata={'tool': tool_name, 'params': params}
                )
                self.current_session.add_message(tool_msg)
            
            return result
        except Exception as e:
            return f"Tool execution error: {str(e)}"
    
    # =================================================================
    # COMMANDS
    # =================================================================
    
    def cmd_help(self, args: str = "") -> str:
        """Show help"""
        help_text = ["## Pi Coding Agent - Commands\n"]
        
        help_text.append("### Core Commands")
        for name, (_, desc) in sorted(self.commands.items()):
            help_text.append(f"  {name:<12} - {desc}")
        
        help_text.append("\n### Tools")
        help_text.append("  read <path> [offset] [limit]  - Read file")
        help_text.append("  write <path> <content>        - Write file")
        help_text.append("  edit <path> <old> <new>       - Edit file")
        help_text.append("  bash <command>                - Execute command")
        
        return '\n'.join(help_text)
    
    def cmd_new_session(self, name: str = "untitled") -> str:
        """Create new session"""
        if self.current_session:
            self.save_session()
        
        session = self.create_session(name if name else "untitled")
        return f"Created new session: {session.id} ({session.name})"
    
    def cmd_save_session(self, args: str = "") -> str:
        """Save current session"""
        return self.save_session()
    
    def cmd_load_session(self, session_id: str = "") -> str:
        """Load a session"""
        if not session_id:
            return "Usage: /load <session_id>"
        
        session = self.load_session(session_id.strip())
        if session:
            return f"Loaded session: {session.id} ({session.name})"
        return f"Session not found: {session_id}"
    
    def cmd_list_sessions(self, args: str = "") -> str:
        """List all sessions"""
        sessions = list(self.sessions_dir.glob("*.json"))
        if not sessions:
            return "No saved sessions"
        
        result = ["## Saved Sessions"]
        for session_file in sorted(sessions, key=lambda p: p.stat().st_mtime, reverse=True):
            try:
                with open(session_file) as f:
                    data = json.load(f)
                sid = data.get('id', session_file.stem)
                name = data.get('name', 'untitled')
                result.append(f"  {sid} - {name}")
            except:
                result.append(f"  {session_file.stem} - (error reading)")
        
        return '\n'.join(result)
    
    def cmd_branch(self, args: str = "") -> str:
        """Create a branch from current node"""
        if not self.current_session:
            return "No active session"
        
        new_id = self.current_session.branch()
        return f"Created branch: {new_id}"
    
    def cmd_rewind(self, node_id: str = "") -> str:
        """Rewind to a specific node"""
        if not self.current_session:
            return "No active session"
        
        if not node_id:
            return "Usage: /rewind <node_id>"
        
        if self.current_session.rewind(node_id.strip()):
            return f"Rewound to node: {node_id}"
        return f"Node not found: {node_id}"
    
    def cmd_show_tree(self, args: str = "") -> str:
        """Show session tree structure"""
        if not self.current_session:
            return "No active session"
        
        def render_tree(node_id: str, prefix: str = "", is_last: bool = True) -> List[str]:
            node = self.current_session.nodes.get(node_id)
            if not node:
                return []
            
            marker = "└── " if is_last else "├── "
            current = " (current)" if node_id == self.current_session.current_node_id else ""
            lines = [f"{prefix}{marker}{node_id}{current}"]
            
            new_prefix = prefix + ("    " if is_last else "│   ")
            for i, child_id in enumerate(node.children):
                is_last_child = i == len(node.children) - 1
                lines.extend(render_tree(child_id, new_prefix, is_last_child))
            
            return lines
        
        return '\n'.join(["## Session Tree"] + render_tree(self.current_session.root_id))
    
    def cmd_summary(self, args: str = "") -> str:
        """Show session summary"""
        if not self.current_session:
            return "No active session"
        
        s = self.current_session
        messages = s.get_all_messages()
        
        return f"""## Session Summary
- ID: {s.id}
- Name: {s.name}
- Created: {s.created_at}
- Current Node: {s.current_node_id}
- Total Nodes: {len(s.nodes)}
- Total Messages: {len(messages)}
- Extensions: {', '.join(ext.name for ext in self.extensions)}
"""


# =============================================================================
# CLI INTERFACE
# =============================================================================

def run_cli():
    """Run the Pi agent CLI"""
    parser = argparse.ArgumentParser(description='Pi Coding Agent')
    parser.add_argument('--workspace', '-w', default='.', help='Workspace directory')
    parser.add_argument('--session', '-s', help='Load session ID')
    args = parser.parse_args()
    
    agent = PiAgent(workspace=args.workspace)
    
    if args.session:
        if agent.load_session(args.session):
            print(f"Loaded session: {agent.current_session.id}")
        else:
            print(f"Session not found: {args.session}")
    
    print("""
╔════════════════════════════════════════════════╗
║  Pi Coding Agent - Python Implementation       ║
║  Tree-structured sessions with self-extension  ║
╚════════════════════════════════════════════════╝

Type /help for commands, or start chatting with the agent.
Press Ctrl+C to exit.
""")
    
    while True:
        try:
            prompt = "\n🥧 pi> " if agent.current_session else "\n🥧 pi (no session)> "
            user_input = input(prompt).strip()
            
            if not user_input:
                continue
            
            response = agent.process_message(user_input)
            print(f"\n{response}")
            
        except KeyboardInterrupt:
            print("\n\nSaving session...")
            if agent.current_session:
                agent.save_session()
            print("Goodbye!")
            break
        except EOFError:
            break


if __name__ == '__main__':
    run_cli()
