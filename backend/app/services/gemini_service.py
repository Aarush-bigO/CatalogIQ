"""BrahMos AI / Google Gemini Service with automatic multi-model fallback."""

import json
import os
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types

from app.config import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


class GeminiService:
    """Interfaces with AI LLM using official SDK with multi-model fallback."""

    def __init__(self):
        self._client = None

    @property
    def api_key(self) -> Optional[str]:
        """Fetch API key dynamically from environment or settings."""
        return (
            os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
            or os.getenv("GEMINI_KEY")
            or get_settings().gemini_api_key
        )

    def get_client(self) -> Optional[genai.Client]:
        """Get or initialize the Google GenAI client."""
        key = self.api_key
        if key and key.strip():
            try:
                return genai.Client(api_key=key.strip())
            except Exception as e:
                logger.error(f"Failed to initialize GenAI client: {e}")
        return None

    @property
    def is_available(self) -> bool:
        """Check if AI API key is configured."""
        return bool(self.api_key and self.api_key.strip())

    async def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_output: bool = True,
    ) -> Dict[str, Any]:
        """Call AI generateContent with automatic model fallback."""
        client = self.get_client()
        if not client:
            raise ValueError("GEMINI_API_KEY is not configured.")

        # Prioritize lightweight ultra-fast models by default
        configured_model = os.getenv("GEMINI_MODEL") or get_settings().gemini_model or "gemini-3.1-flash-lite"
        models_to_try = [
            configured_model,
            "gemini-3.1-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-3.7-flash",
        ]
        
        # Deduplicate while preserving order
        unique_models = []
        for m in models_to_try:
            if m and m not in unique_models:
                unique_models.append(m)

        config = types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=1024,
            system_instruction=system_instruction,
            response_mime_type="application/json" if json_output else "text/plain",
        )

        last_error = None
        for model in unique_models:
            try:
                response = await client.aio.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
                if response and response.text:
                    if json_output:
                        try:
                            return json.loads(response.text)
                        except Exception:
                            return {"text": response.text}
                    return {"text": response.text}
            except Exception as e:
                logger.warning(f"BrahMos AI model {model} attempt failed: {e}. Trying next fallback...")
                last_error = e

        logger.error(f"All BrahMos AI models failed. Last error: {last_error}")
        raise last_error or RuntimeError("All BrahMos AI models failed")

    async def enrich_product(self, product: Any, enrichment_type: str = "full") -> Dict[str, Any]:
        """Use BrahMos AI to intelligently enrich industrial product data."""
        system_prompt = (
            "You are BrahMos AI, an industrial engineer and product data specialist. "
            "Analyze the given product, fill missing technical specs, write professional descriptions, and output strictly JSON."
        )

        prompt = (
            f"Analyze and enrich this industrial product ({enrichment_type} enrichment):\n"
            f"SKU: {getattr(product, 'sku', 'N/A')}\n"
            f"Name: {getattr(product, 'name', 'N/A')}\n"
            f"Brand: {getattr(product, 'brand', 'N/A')}\n"
            f"Category: {getattr(product, 'category', 'N/A')}\n"
            f"Current Description: {getattr(product, 'description', 'N/A')}\n"
            f"Current Attributes: {json.dumps(getattr(product, 'attributes', {}) or {})}\n"
            f"Current Specifications: {json.dumps(getattr(product, 'specifications', {}) or {})}\n\n"
            f"Provide a structured JSON object with keys:\n"
            f"- 'description': 2-3 sentence technical overview\n"
            f"- 'category': Standard industrial category\n"
            f"- 'subcategory': Subcategory\n"
            f"- 'attributes': Object of attributes (material, finish, mount)\n"
            f"- 'specifications': Object of engineering specs (ratings, tolerances, duty cycle)\n"
            f"- 'confidence': Float score 0.85-0.99\n"
            f"- 'ai_reasoning': Brief deduction rationale based on industrial standards"
        )

        return await self.generate_content(prompt, system_instruction=system_prompt, json_output=True)

