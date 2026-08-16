"""Image processing utilities."""

import io
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from PIL import Image


def resize_image(
    image_path: str,
    max_width: int = 1024,
    max_height: int = 1024,
    output_path: Optional[str] = None,
) -> str:
    """Resize an image while maintaining aspect ratio."""
    img = Image.open(image_path)
    
    # Calculate new size
    ratio = min(max_width / img.width, max_height / img.height, 1.0)
    new_size = (int(img.width * ratio), int(img.height * ratio))
    
    if new_size != img.size:
        img = img.resize(new_size, Image.LANCZOS)
    
    # Save
    if output_path:
        img.save(output_path)
        return output_path
    else:
        base = Path(image_path)
        out_path = base.parent / f"{base.stem}_resized{base.suffix}"
        img.save(out_path)
        return str(out_path)


def convert_pdf_page_to_image(
    pdf_path: str,
    page_number: int = 0,
    dpi: int = 200,
    output_dir: Optional[str] = None,
) -> str:
    """Convert a PDF page to an image using pdf2image."""
    from pdf2image import convert_from_path
    
    images = convert_from_path(
        pdf_path,
        first_page=page_number + 1,
        last_page=page_number + 1,
        dpi=dpi,
    )
    
    if not images:
        raise ValueError(f"Could not extract page {page_number} from {pdf_path}")
    
    base = Path(pdf_path)
    out_dir = Path(output_dir) if output_dir else base.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = out_dir / f"{base.stem}_page_{page_number + 1}.png"
    images[0].save(output_path, "PNG")
    
    return str(output_path)


def convert_pdf_to_images(
    pdf_path: str,
    dpi: int = 200,
    output_dir: Optional[str] = None,
) -> List[Dict[str, any]]:
    """Convert all pages of a PDF to images."""
    from pdf2image import convert_from_path
    
    images = convert_from_path(pdf_path, dpi=dpi)
    
    base = Path(pdf_path)
    out_dir = Path(output_dir) if output_dir else base.parent / f"{base.stem}_pages"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    results = []
    for i, img in enumerate(images):
        output_path = out_dir / f"page_{i + 1}.png"
        img.save(output_path, "PNG")
        results.append({
            "page_number": i + 1,
            "path": str(output_path),
            "width": img.width,
            "height": img.height,
            "dpi": dpi,
        })
    
    return results


def get_image_info(image_path: str) -> Dict[str, any]:
    """Get metadata about an image."""
    img = Image.open(image_path)
    return {
        "width": img.width,
        "height": img.height,
        "format": img.format,
        "mode": img.mode,
        "file_size_bytes": Path(image_path).stat().st_size,
    }


def optimize_image_for_ocr(
    image_path: str,
    output_path: Optional[str] = None,
) -> str:
    """Optimize image for OCR processing."""
    img = Image.open(image_path)
    
    # Convert to grayscale
    if img.mode != "L":
        img = img.convert("L")
    
    # Increase contrast
    from PIL import ImageEnhance
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    
    # Denoise slightly
    img = img.filter(ImageFilter.MedianFilter(size=3))
    
    # Save
    if output_path:
        img.save(output_path)
        return output_path
    
    base = Path(image_path)
    out_path = base.parent / f"{base.stem}_ocr_optimized{base.suffix}"
    img.save(out_path)
    return str(out_path)


# Need to import ImageFilter
from PIL import ImageFilter
