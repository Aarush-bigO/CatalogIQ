"""Base class for AI agents in the product intelligence platform."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


class BaseAgent(ABC):
    """
    Abstract base class for all AI agents in the platform.
    Provides common LLM interaction patterns, memory, and tool access.
    """

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.memory: List[Dict[str, Any]] = []
        self.max_memory_items = 10

    @abstractmethod
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's main task. Must be implemented by subclasses."""
        pass

    async def call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        expect_json: bool = False,
    ) -> Dict[str, Any]:
        """Call the configured LLM with retry logic."""
        if settings.openai_api_key:
            return await self._call_openai(system_prompt, user_prompt, temperature, max_tokens, expect_json)
        return await self._call_ollama(system_prompt, user_prompt, temperature, max_tokens, expect_json)

    async def _call_openai(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
        expect_json: bool,
    ) -> Dict[str, Any]:
        """Call OpenAI with retries."""
        import openai
        from tenacity import retry, stop_after_attempt, wait_exponential

        @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
        async def _call():
            client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
            
            response_format = {"type": "json_object"} if expect_json else None
            
            response = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                response_format=response_format,
            )
            
            return {
                "text": response.choices[0].message.content or "",
                "tokens_input": response.usage.prompt_tokens if response.usage else 0,
                "tokens_output": response.usage.completion_tokens if response.usage else 0,
            }
        
        return await _call()

    async def _call_ollama(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
        expect_json: bool,
    ) -> Dict[str, Any]:
        """Call local Ollama."""
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.ollama_base_url}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "system": system_prompt,
                    "prompt": user_prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,
                    },
                    "format": "json" if expect_json else None,
                },
                timeout=120.0,
            )
            response.raise_for_status()
            data = response.json()
        
        return {"text": data.get("response", "")}

    def add_to_memory(self, role: str, content: str, metadata: Optional[Dict] = None):
        """Add an interaction to agent memory."""
        self.memory.append({
            "role": role,
            "content": content,
            "metadata": metadata or {},
        })
        # Trim memory if too long
        if len(self.memory) > self.max_memory_items:
            self.memory = self.memory[-self.max_memory_items:]

    def build_memory_context(self) -> str:
        """Build context string from memory."""
        if not self.memory:
            return ""
        return "\n\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in self.memory[-5:]
        )

    def parse_json_response(self, text: str) -> Dict[str, Any]:
        """Safely parse JSON from LLM response."""
        import json
        
        if not text:
            return {}
        
        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try extracting from markdown
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            try:
                return json.loads(text[start:end].strip())
            except (json.JSONDecodeError, ValueError):
                pass
        
        # Try finding first { and last }
        try:
            start = text.index("{")
            end = text.rindex("}") + 1
            return json.loads(text[start:end])
        except (ValueError, json.JSONDecodeError):
            pass
        
        logger.warning(f"Could not parse JSON from response: {text[:200]}")
        return {"raw_text": text}
