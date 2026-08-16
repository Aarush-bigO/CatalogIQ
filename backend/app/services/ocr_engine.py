"""OCR Engine - Text extraction from images and scanned documents."""

import io
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pytesseract
from PIL import Image

from app.config import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

# Configure Tesseract path if provided
if settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


class OCREngine:
    """Optical Character Recognition service using Tesseract + EasyOCR fallback."""

    def __init__(self):
        self.engine = "tesseract"
        self.lang = "eng"
        self._easyocr_reader = None

    def _get_easyocr_reader(self):
        """Lazy-load EasyOCR reader."""
        if self._easyocr_reader is None:
            try:
                import easyocr
                self._easyocr_reader = easyocr.Reader(["en"], gpu=False)
                logger.info("EasyOCR reader initialized")
            except Exception as e:
                logger.warning(f"Could not initialize EasyOCR: {e}")
        return self._easyocr_reader

    async def extract_text_from_image(
        self,
        image_path: str,
        preprocess: bool = True,
    ) -> Dict[str, Any]:
        """
        Extract text from an image file.
        
        Returns:
            {
                "text": str,
                "confidence": float,
                "language": str,
                "processing_time_ms": int,
                "engine": str,
            }
        """
        start = time.time()
        
        try:
            image = Image.open(image_path)
            
            # Preprocess for better OCR
            if preprocess:
                image = self._preprocess_image(image)
            
            # Run Tesseract OCR
            ocr_data = pytesseract.image_to_data(
                image,
                lang=self.lang,
                output_type=pytesseract.Output.DICT,
            )
            
            # Extract text and compute average confidence
            text_parts = []
            confidences = []
            
            for i, text in enumerate(ocr_data["text"]):
                if text.strip():
                    text_parts.append(text)
                    conf = int(ocr_data["conf"][i])
                    if conf > 0:
                        confidences.append(conf)
            
            full_text = " ".join(text_parts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            processing_time = int((time.time() - start) * 1000)
            
            logger.info(
                f"OCR completed: {image_path} - "
                f"{len(full_text)} chars, confidence {avg_confidence:.1f}"
            )
            
            return {
                "text": full_text,
                "confidence": round(avg_confidence, 2),
                "language": self.lang,
                "processing_time_ms": processing_time,
                "engine": self.engine,
            }
            
        except Exception as e:
            logger.error(f"OCR failed for {image_path}: {e}")
            return {
                "text": "",
                "confidence": 0.0,
                "language": self.lang,
                "processing_time_ms": int((time.time() - start) * 1000),
                "engine": self.engine,
                "error": str(e),
            }

    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """Apply preprocessing to improve OCR accuracy."""
        # Convert to grayscale
        if image.mode != "L":
            image = image.convert("L")
        
        # Increase resolution if too small
        min_dpi = 200
        current_dpi = image.info.get("dpi", (72, 72))[0]
        if current_dpi < min_dpi:
            scale = min_dpi / current_dpi
            new_size = (int(image.width * scale), int(image.height * scale))
            image = image.resize(new_size, Image.LANCZOS)
        
        # Apply adaptive thresholding via point transform
        # Simple contrast enhancement
        image = image.point(lambda x: 0 if x < 128 else 255, "1").convert("L")
        
        return image

    async def extract_text_from_pdf_page(
        self,
        page_image_path: str,
    ) -> Dict[str, Any]:
        """Extract text from a PDF page that has been converted to image."""
        return await self.extract_text_from_image(page_image_path)

    async def extract_structured_data(
        self,
        image_path: str,
    ) -> Dict[str, Any]:
        """
        Extract structured data (tables, key-value pairs) from an image.
        Uses OCR + heuristics for layout analysis.
        """
        result = await self.extract_text_from_image(image_path)
        text = result["text"]
        
        # Simple heuristics to detect key-value pairs
        # In production, use layout-aware models like LayoutLMv3
        lines = text.split("\n")
        kv_pairs = {}
        tables = []
        
        current_table = []
        in_table = False
        
        for line in lines:
            line = line.strip()
            if not line:
                if in_table and current_table:
                    tables.append(current_table)
                    current_table = []
                    in_table = False
                continue
            
            # Detect key-value pairs (e.g., "Color: Red")
            if ":" in line and not in_table:
                parts = line.split(":", 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    value = parts[1].strip()
                    if key and value:
                        kv_pairs[key] = value
            
            # Detect table rows (multiple columns separated by spaces/tabs)
            elif len(line.split()) >= 3 and not ":" in line:
                in_table = True
                current_table.append(line.split())
        
        return {
            "text": text,
            "key_value_pairs": kv_pairs,
            "tables": tables,
            **{k: v for k, v in result.items() if k != "text"},
        }

    async def batch_extract(
        self,
        image_paths: List[str],
    ) -> List[Dict[str, Any]]:
        """Extract text from multiple images."""
        results = []
        for path in image_paths:
            result = await self.extract_text_from_image(path)
            results.append({"path": path, **result})
        return results
