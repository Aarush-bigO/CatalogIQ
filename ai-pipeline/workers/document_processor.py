"""Document processing worker - processes uploaded documents through OCR and VLM."""

import asyncio
import sys
import uuid
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.document import DocumentType, ProcessingStatus, SourceDocument
from app.services.document_ingestion import DocumentIngestionService
from app.services.ocr_engine import OCREngine
from app.services.vlm_extractor import VLMExtractor
from app.utils.image_utils import convert_pdf_to_images
from app.utils.logger import configure_logging, get_logger

configure_logging()
logger = get_logger("document_processor")
settings = get_settings()


async def process_document(document_id: uuid.UUID) -> None:
    """Process a single document through the pipeline."""
    async with AsyncSessionLocal() as db:
        service = DocumentIngestionService(db)
        ocr = OCREngine()
        vlm = VLMExtractor()
        
        doc = await service.get_document(document_id)
        if not doc:
            logger.error(f"Document {document_id} not found")
            return
        
        logger.info(f"Processing document: {doc.original_filename} ({doc.doc_type.value})")
        
        try:
            # Step 1: Convert to images if PDF
            image_paths = []
            if doc.doc_type == DocumentType.PDF:
                doc.status = ProcessingStatus.EXTRACTING
                await db.flush()
                
                pages = convert_pdf_to_images(
                    doc.file_path,
                    dpi=200,
                    output_dir=str(Path(doc.file_path).parent / "pages"),
                )
                await service.save_page_images(document_id, pages)
                image_paths = [p["path"] for p in pages]
                doc.page_count = len(pages)
                
            elif doc.doc_type == DocumentType.IMAGE:
                image_paths = [doc.file_path]
            
            # Step 2: OCR on all pages/images
            if image_paths and settings.enable_ocr:
                doc.status = ProcessingStatus.OCR_RUNNING
                await db.flush()
                
                for i, img_path in enumerate(image_paths):
                    result = await ocr.extract_text_from_image(img_path)
                    await service.save_ocr_result(
                        document_id=document_id,
                        page_number=i + 1,
                        text=result["text"],
                        engine=result["engine"],
                        confidence=result.get("confidence"),
                        processing_time_ms=result.get("processing_time_ms"),
                    )
            
            # Step 3: VLM extraction on images
            if image_paths and settings.enable_vlm:
                doc.status = ProcessingStatus.AI_ANALYZING
                await db.flush()
                
                vlm_result = await vlm.extract_from_pdf_pages(image_paths)
                
                if vlm_result.get("success"):
                    extracted = vlm_result.get("extracted_data", {})
                    
                    # Create extraction record
                    await service.save_extraction(
                        document_id=document_id,
                        product_id=None,  # Will be linked during product creation
                        extraction_method="vlm",
                        extracted_data=extracted,
                        confidence=vlm_result.get("confidence", 0),
                        model_version=vlm_result.get("model"),
                    )
                    
                    # Try to create or update product
                    await _create_or_update_product(db, doc, extracted)
            
            doc.status = ProcessingStatus.COMPLETED
            doc.processed_at = datetime.utcnow()
            logger.info(f"Document {document_id} processed successfully")
            
        except Exception as e:
            doc.status = ProcessingStatus.FAILED
            doc.error_message = str(e)
            logger.error(f"Document {document_id} processing failed: {e}")
        
        await db.commit()


async def _create_or_update_product(
    db: AsyncSession,
    doc: SourceDocument,
    extracted: dict,
) -> None:
    """Create or update a product from extracted data."""
    from app.models.product import Product
    from app.services.product_service import ProductService
    
    service = ProductService(db)
    
    sku = extracted.get("sku") or extracted.get("part_number") or extracted.get("model_number")
    name = extracted.get("name") or extracted.get("product_name")
    
    if not sku or not name:
        logger.warning(f"Insufficient data to create product from document {doc.id}")
        return
    
    # Check if product exists
    existing = await service.get_product_by_sku(sku)
    
    if existing:
        # Update existing
        updates = {
            "description": extracted.get("description") or existing.description,
            "category": extracted.get("category") or existing.category,
            "brand": extracted.get("brand") or existing.brand,
            "manufacturer": extracted.get("manufacturer") or existing.manufacturer,
            "attributes": {**(existing.attributes or {}), **(extracted.get("attributes", {}))},
            "specifications": {**(existing.specifications or {}), **(extracted.get("specifications", {}))},
        }
        await service.update_product(existing.id, updates)
        logger.info(f"Updated product {existing.id} from document {doc.id}")
    else:
        # Create new
        product_data = {
            "sku": sku,
            "name": name,
            "description": extracted.get("description"),
            "category": extracted.get("category"),
            "brand": extracted.get("brand"),
            "manufacturer": extracted.get("manufacturer"),
            "attributes": extracted.get("attributes", {}),
            "specifications": extracted.get("specifications", {}),
            "source_catalog": doc.catalog_name,
            "source_documents": [str(doc.id)],
        }
        product = await service.create_product(product_data)
        logger.info(f"Created product {product.id} from document {doc.id}")


async def poll_and_process() -> None:
    """Poll for pending documents and process them."""
    from datetime import datetime
    from sqlalchemy import select
    
    logger.info("Document processor worker started")
    
    while True:
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(SourceDocument)
                    .where(SourceDocument.status.in_([
                        ProcessingStatus.UPLOADED,
                        ProcessingStatus.QUEUED_FOR_ENRICHMENT,
                    ]))
                    .limit(1)
                )
                doc = result.scalar_one_or_none()
                
                if doc:
                    await process_document(doc.id)
                else:
                    await asyncio.sleep(5)
                    
        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(poll_and_process())
