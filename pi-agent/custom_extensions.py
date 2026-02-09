"""
Example Custom Extension for Pi Agent

This shows how to create extensions that add commands,
persist state, and interact with the agent.
"""

from pi_agent import Extension, PiAgent
from typing import Dict, Any, List
from pathlib import Path


class NotesExtension(Extension):
    """
    A simple note-taking extension.
    Demonstrates state persistence across sessions.
    """
    
    name = "notes"
    description = "Simple note-taking system"
    
    def __init__(self, agent: PiAgent):
        super().__init__(agent)
        self.notes_dir = Path.home() / ".pi" / "notes"
        self.notes_dir.mkdir(parents=True, exist_ok=True)
        self._notes_cache: Dict[str, str] = {}
    
    def register(self):
        """Register commands with the agent"""
        self.agent.register_command("/note", self.create_note, "Create a note")
        self.agent.register_command("/notes", self.list_notes, "List all notes")
        self.agent.register_command("/note-show", self.show_note, "Show a note")
        self.agent.register_command("/note-rm", self.delete_note, "Delete a note")
    
    def create_note(self, args: str) -> str:
        """Create a new note: /note <name> <content>"""
        parts = args.split(maxsplit=1)
        if len(parts) < 2:
            return "Usage: /note <name> <content>"
        
        name, content = parts
        note_file = self.notes_dir / f"{name}.md"
        
        # Add timestamp
        from datetime import datetime
        header = f"# {name}\n\nCreated: {datetime.now().isoformat()}\n\n"
        
        note_file.write_text(header + content)
        self._notes_cache[name] = content
        
        return f"Created note: {name}"
    
    def list_notes(self, args: str = "") -> str:
        """List all notes"""
        notes = sorted(self.notes_dir.glob("*.md"))
        if not notes:
            return "No notes found"
        
        result = ["## Notes"]
        for note_file in notes:
            # Get first line as title
            content = note_file.read_text()
            title = content.split('\n')[0].lstrip('# ') if content else note_file.stem
            result.append(f"  - {note_file.stem}: {title}")
        
        return '\n'.join(result)
    
    def show_note(self, name: str) -> str:
        """Show a specific note: /note-show <name>"""
        name = name.strip()
        if not name:
            return "Usage: /note-show <name>"
        
        note_file = self.notes_dir / f"{name}.md"
        if not note_file.exists():
            return f"Note not found: {name}"
        
        return note_file.read_text()
    
    def delete_note(self, name: str) -> str:
        """Delete a note: /note-rm <name>"""
        name = name.strip()
        if not name:
            return "Usage: /note-rm <name>"
        
        note_file = self.notes_dir / f"{name}.md"
        if not note_file.exists():
            return f"Note not found: {name}"
        
        note_file.unlink()
        self._notes_cache.pop(name, None)
        return f"Deleted note: {name}"
    
    def get_state(self) -> Dict[str, Any]:
        """Get state for persistence"""
        return {
            'notes_cache': self._notes_cache,
            'notes_count': len(list(self.notes_dir.glob("*.md")))
        }
    
    def set_state(self, state: Dict[str, Any]):
        """Restore state from session"""
        self._notes_cache = state.get('notes_cache', {})


class GitExtension(Extension):
    """
    Git helper extension.
    Shows git status, recent commits, etc.
    """
    
    name = "git"
    description = "Git helpers"
    
    def register(self):
        self.agent.register_command("/git-status", self.git_status, "Show git status")
        self.agent.register_command("/git-log", self.git_log, "Show recent commits")
        self.agent.register_command("/git-diff", self.git_diff, "Show current diff")
    
    def git_status(self, args: str = "") -> str:
        """Show git status"""
        result = self.agent.tools['bash']("git status --short", cwd=str(self.agent.workspace))
        if not result.strip():
            return "Working tree clean"
        return f"## Git Status\n```\n{result}\n```"
    
    def git_log(self, args: str = "5") -> str:
        """Show recent commits"""
        try:
            n = int(args.strip() or 5)
        except:
            n = 5
        
        result = self.agent.tools['bash'](
            f"git log --oneline -{n}",
            cwd=str(self.agent.workspace)
        )
        return f"## Recent Commits\n```\n{result}\n```"
    
    def git_diff(self, args: str = "") -> str:
        """Show current diff"""
        result = self.agent.tools['bash']("git diff --stat", cwd=str(self.agent.workspace))
        if not result.strip():
            return "No changes"
        return f"## Changes\n```\n{result}\n```"


# =============================================================================
# How to Load Custom Extensions
# =============================================================================

def load_custom_extensions(agent: PiAgent):
    """Load custom extensions into the agent"""
    
    # Load notes extension
    notes = NotesExtension(agent)
    notes.register()
    agent.extensions.append(notes)
    
    # Load git extension
    git = GitExtension(agent)
    git.register()
    agent.extensions.append(git)
    
    return agent


# Example usage in pi_agent.py:
# 
# In PiAgent._load_extensions():
# 
# def _load_extensions(self):
#     # Load built-in extensions
#     todos = TodosExtension(self)
#     todos.register()
#     self.extensions.append(todos)
#     
#     # Load custom extensions
#     from custom_extensions import load_custom_extensions
#     load_custom_extensions(self)
