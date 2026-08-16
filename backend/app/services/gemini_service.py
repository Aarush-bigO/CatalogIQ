"""Google Gemini AI Service with automatic multi-model fallback."""

import json
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types

from app.config import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

FALLBACK_MODELS = [
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
]


class GeminiService:
    """Interfaces with Google Gemini API using official SDK with multi-model fallback."""

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self._client = None
        if self.api_key:
            self._client = genai.Client(api_key=self.api_key)

    @property
    def is_available(self) -> bool:
        """Check if Gemini API key is configured."""
        return bool(self.api_key and self.api_key.strip() and self._client is not None)

    async def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_output: bool = True,
    ) -> Dict[str, Any]:
        """Call Gemini generateContent with automatic model fallback."""
        if not self.is_available:
            raise ValueError("GEMINI_API_KEY is not configured.")

        config = types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=2048,
            system_instruction=system_instruction,
            response_mime_type="application/json" if json_output else "text/plain",
        )

        last_error = None
        for model in FALLBACK_MODELS:
            try:
                response = await self._client.aio.models.generate_content(
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
                logger.warning(f"Gemini model {model} attempt failed: {e}. Trying next fallback...")
                last_error = e

        logger.error(f"All Gemini models failed. Last error: {last_error}")
        raise last_error or RuntimeError("All Gemini models failed")

    async def enrich_product(self, product: Any, enrichment_type: str = "full") -> Dict[str, Any]:
        """Use Gemini to intelligently enrich industrial product data."""
        system_prompt = (
            "You are an industrial engineer and product data specialist. "
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
