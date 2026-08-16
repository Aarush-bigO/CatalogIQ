"""Vision-Language Model (VLM) Extractor for product images and technical documents."""

import base64
import io
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


class VLMExtractor:
    """
    Extracts structured product data from images and PDF pages using
    Vision-Language Models (GPT-4 Vision, LLaVA, etc.).
    """

    def __init__(self):
        self.model = settings.openai_model if settings.openai_api_key else settings.ollama_model
        self.provider = "openai" if settings.openai_api_key else "ollama"

    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64 for API consumption."""
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def _get_mime_type(self, image_path: str) -> str:
        """Detect MIME type from file extension."""
        ext = Path(image_path).suffix.lower()
        mime_types = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
        }
        return mime_types.get(ext, "image/jpeg")

    def _build_extraction_prompt(self) -> str:
        """Build the system prompt for product data extraction."""
        return (
            "You are an expert industrial product data extraction system. "
            "Analyze the provided image of a product or technical document. "
            "Extract all identifiable product information and return it as a JSON object.\n\n"
            "Required fields to extract if present:\n"
            "- sku / part_number / model_number\n"
            "- name / product_name\n"
            "- description\n"
            "- category / product_category\n"
            "- brand / manufacturer\n"
            "- specifications (dict of technical specs)\n"
            "- attributes (dict of additional attributes like color, material, dimensions)\n"
            "- list_price / price\n"
            "- currency\n"
            "- certifications\n"
            "- country_of_origin\n\n"
            "Rules:\n"
            "1. Return ONLY valid JSON, no markdown formatting.\n"
            "2. Use null for missing fields.\n"
            "3. Be precise with measurements and specifications.\n"
            "4. If the image contains a table, extract all rows.\n"
            "5. For technical drawings, extract dimensions and tolerances.\n"
        )

    async def extract_from_image(
        self,
        image_path: str,
        custom_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Extract structured product data from an image using VLM.
        
        Returns:
            {
                "success": bool,
                "extracted_data": dict,
                "raw_response": str,
                "confidence": float,
                "processing_time_ms": int,
                "model": str,
            }
        """
        start = time.time()
        
        try:
            if self.provider == "openai":
                result = await self._extract_openai(image_path, custom_prompt)
            else:
                result = await self._extract_ollama(image_path, custom_prompt)
            
            result["processing_time_ms"] = int((time.time() - start) * 1000)
            logger.info(
                f"VLM extraction completed: {image_path} using {self.model}"
            )
            return result
            
        except Exception as e:
            logger.error(f"VLM extraction failed for {image_path}: {e}")
            return {
                "success": False,
                "extracted_data": {},
                "raw_response": "",
                "confidence": 0.0,
                "processing_time_ms": int((time.time() - start) * 1000),
                "model": self.model,
                "error": str(e),
            }

    async def _extract_openai(
        self,
        image_path: str,
        custom_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Extract using OpenAI GPT-4 Vision."""
        import openai
        
        client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        base64_image = self._encode_image(image_path)
        mime_type = self._get_mime_type(image_path)
        
        prompt = custom_prompt or self._build_extraction_prompt()
        
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}",
                                "detail": "high",
                            },
                        },
                    ],
                },
            ],
            max_tokens=4096,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        
        raw_text = response.choices[0].message.content or "{}"
        
        import json
        try:
            extracted = json.loads(raw_text)
        except json.JSONDecodeError:
            extracted = {"raw_text": raw_text}
        
        # Estimate confidence based on field completeness
        confidence = self._estimate_confidence(extracted)
        
        return {
            "success": True,
            "extracted_data": extracted,
            "raw_response": raw_text,
            "confidence": confidence,
            "model": self.model,
            "tokens_input": response.usage.prompt_tokens if response.usage else 0,
            "tokens_output": response.usage.completion_tokens if response.usage else 0,
        }

    async def _extract_ollama(
        self,
        image_path: str,
        custom_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Extract using local Ollama VLM (e.g., LLaVA)."""
        import httpx
        
        base64_image = self._encode_image(image_path)
        prompt = custom_prompt or self._build_extraction_prompt()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.ollama_base_url}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt + "\n\n[IMAGE]",
                    "images": [base64_image],
                    "stream": False,
                    "format": "json",
                },
                timeout=120.0,
            )
            response.raise_for_status()
            data = response.json()
        
        raw_text = data.get("response", "{}")
        
        import json
        try:
            extracted = json.loads(raw_text)
        except json.JSONDecodeError:
            extracted = {"raw_text": raw_text}
        
        confidence = self._estimate_confidence(extracted)
        
        return {
            "success": True,
            "extracted_data": extracted,
            "raw_response": raw_text,
            "confidence": confidence,
            "model": self.model,
        }

    def _estimate_confidence(self, extracted: Dict[str, Any]) -> float:
        """Estimate extraction confidence based on field completeness."""
        core_fields = ["sku", "name", "description", "category", "brand"]
        filled = sum(1 for f in core_fields if extracted.get(f))
        
        specs = extracted.get("specifications", {})
        attrs = extracted.get("attributes", {})
        
        # Bonus for having specifications and attributes
        bonus = min(20, (len(specs) + len(attrs)) * 2)
        
        base = (filled / len(core_fields)) * 80
        return min(100, base + bonus)

    async def extract_from_pdf_pages(
        self,
        page_image_paths: List[str],
    ) -> List[Dict[str, Any]]:
        """Extract from multiple PDF page images and merge results."""
        results = []
        for path in page_image_paths:
            result = await self.extract_from_image(path)
            results.append({"page": Path(path).stem, **result})
        
        # Merge extractions with highest confidence per field
        merged = self._merge_extractions(results)
        return merged

    def _merge_extractions(
        self,
        results: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Merge multiple page extractions, keeping highest-confidence values."""
        merged_data: Dict[str, Any] = {}
        max_confidence = 0.0
        
        for r in results:
            if not r.get("success"):
                continue
            
            data = r.get("extracted_data", {})
            conf = r.get("confidence", 0)
            
            if conf > max_confidence:
                max_confidence = conf
                # For core fields, prefer highest confidence
                for key in ["sku", "name", "brand", "category"]:
                    if data.get(key):
                        merged_data[key] = data[key]
            
            # Merge specifications and attributes (union)
            for nested_key in ["specifications", "attributes"]:
                if nested_key in data and isinstance(data[nested_key], dict):
                    if nested_key not in merged_data:
                        merged_data[nested_key] = {}
                    merged_data[nested_key].update(data[nested_key])
        
        return {
            "success": True,
            "extracted_data": merged_data,
            "confidence": max_confidence,
            "page_results": results,
        }
