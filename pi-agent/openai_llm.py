"""
OpenAI LLM Integration for Pi Agent

Usage:
    from pi_agent import PiAgent
    from openai_llm import OpenAILLM
    
    agent = PiAgent()
    agent.llm = OpenAILLM(api_key="your-key")
"""

import json
from typing import List, Dict, Callable, Any
from pi_agent import LLMInterface, Message


class OpenAILLM(LLMInterface):
    """OpenAI GPT-4 integration for Pi Agent"""
    
    def __init__(self, api_key: str, model: str = "gpt-4"):
        try:
            import openai
        except ImportError:
            raise ImportError("Please install openai: pip install openai")
        
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model
    
    def _format_tools(self, tools: Dict[str, Callable]) -> str:
        """Format tools for system prompt"""
        tool_desc = []
        for name, func in tools.items():
            import inspect
            sig = inspect.signature(func)
            doc = func.__doc__ or "No description"
            tool_desc.append(f"- {name}{sig}: {doc}")
        
        return "\n".join(tool_desc)
    
    def _create_system_prompt(self, tools: Dict[str, Callable]) -> str:
        """Create system prompt with tool descriptions"""
        return f"""You are Pi, a minimal coding agent. You have access to these tools:

{self._format_tools(tools)}

When you want to use a tool, format your response like this:

<tool>tool_name</tool>
<params>
<param1>value1</param1>
<param2>value2</param2>
</params>

The user can then execute the tool and provide you the result.

Guidelines:
1. Always check if files exist before writing
2. Use edit for small changes, write for new files
3. Use bash for running tests, linting, etc.
4. Ask clarifying questions if needed
5. Be concise but thorough
"""
    
    def generate(self, messages: List[Message], tools: Dict[str, Callable]) -> str:
        """Generate response using OpenAI"""
        import openai
        
        # Build conversation
        openai_messages = [
            {"role": "system", "content": self._create_system_prompt(tools)}
        ]
        
        for msg in messages:
            if msg.role in ('user', 'assistant'):
                openai_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
            elif msg.role == 'extension':
                # Tool results as system messages
                openai_messages.append({
                    "role": "system",
                    "content": f"Tool result: {msg.content[:1000]}"
                })
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=openai_messages,
                temperature=0.7,
                max_tokens=4000
            )
            
            return response.choices[0].message.content
            
        except openai.RateLimitError:
            return "Error: Rate limit exceeded. Please try again later."
        except openai.APIError as e:
            return f"Error: OpenAI API error: {str(e)}"
        except Exception as e:
            return f"Error generating response: {str(e)}"


class AnthropicLLM(LLMInterface):
    """Anthropic Claude integration for Pi Agent"""
    
    def __init__(self, api_key: str, model: str = "claude-3-opus-20240229"):
        try:
            import anthropic
        except ImportError:
            raise ImportError("Please install anthropic: pip install anthropic")
        
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model
    
    def _format_tools(self, tools: Dict[str, Callable]) -> str:
        """Format tools for system prompt"""
        tool_desc = []
        for name, func in tools.items():
            import inspect
            sig = inspect.signature(func)
            doc = func.__doc__ or "No description"
            tool_desc.append(f"- {name}{sig}: {doc}")
        
        return "\n".join(tool_desc)
    
    def generate(self, messages: List[Message], tools: Dict[str, Callable]) -> str:
        """Generate response using Anthropic Claude"""
        import anthropic
        
        # Build conversation
        system_prompt = f"""You are Pi, a minimal coding agent. You have access to these tools:

{self._format_tools(tools)}

When you want to use a tool, format your response like this:

<tool>tool_name</tool>
<params>
<param1>value1</param1>
<param2>value2</param2>
</params>
"""
        
        # Convert messages to Anthropic format
        anthropic_messages = []
        for msg in messages:
            if msg.role in ('user', 'assistant'):
                anthropic_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                system=system_prompt,
                messages=anthropic_messages
            )
            
            return response.content[0].text
            
        except Exception as e:
            return f"Error generating response: {str(e)}"


# Example usage
if __name__ == '__main__':
    import os
    from pi_agent import PiAgent, run_cli
    
    # Create agent with OpenAI
    agent = PiAgent()
    
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        agent.llm = OpenAILLM(api_key=api_key)
        print("Using OpenAI GPT-4")
    else:
        print("OPENAI_API_KEY not set, using mock LLM")
    
    # Run CLI
    run_cli()
