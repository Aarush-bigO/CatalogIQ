"""Document ingestion router."""

import os
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.services.document_ingestion import DocumentIngestionService
from pydantic import BaseModel

router = APIRouter()
settings = get_settings()


# ============ Schemas ============

class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    message: str


class DocumentResponse(BaseModel):
    id: str
    filename: str
    doc_type: str
    status: str
    file_size_bytes: int
    page_count: Optional[int] = None
    created_at: Optional[str] = None


class ExtractionResponse(BaseModel):
    id: str
    extraction_method: str
    confidence: float
    page_number: Optional[int] = None
    extracted_data: dict = {}
    created_at: Optional[str] = None


def _to_str_val(v: any) -> str:
    if hasattr(v, "value"):
        return str(v.value)
    return str(v) if v is not None else ""


# ============ Routes ============

@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a product document",
)
async def upload_document(
    file: UploadFile = File(...),
    catalog_name: Optional[str] = Query(None),
    source_url: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Upload a product document (PDF, image, Excel, etc.) for AI processing."""
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    if ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed: {settings.allowed_extensions_list}",
        )

    contents = await file.read()
    if len(contents) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {settings.max_upload_size_mb}MB",
        )

    service = DocumentIngestionService(db)
    doc = await service.upload_document(
        filename=filename,
        contents=contents,
        mime_type=file.content_type or "application/octet-stream",
        catalog_name=catalog_name,
        source_url=source_url,
    )

    return DocumentUploadResponse(
        id=str(doc.id),
        filename=doc.original_filename,
        status=_to_str_val(doc.status),
        message="Document uploaded and queued for processing",
    )


@router.get(
    "/",
    response_model=List[DocumentResponse],
    summary="List uploaded documents",
)
async def list_documents(
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query(None),
    doc_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """List all uploaded documents with optional filtering."""
    service = DocumentIngestionService(db)
    docs = await service.list_documents(
        status=status, doc_type=doc_type, page=page, page_size=page_size
    )
    return [
        DocumentResponse(
            id=str(d.id),
            filename=d.original_filename,
            doc_type=_to_str_val(d.doc_type),
            status=_to_str_val(d.status),
            file_size_bytes=d.file_size_bytes,
            page_count=d.page_count,
            created_at=d.created_at.isoformat() if d.created_at else None,
        )
        for d in docs
    ]


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document details",
)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single document by ID."""
    service = DocumentIngestionService(db)
    doc = await service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse(
        id=str(doc.id),
        filename=doc.original_filename,
        doc_type=_to_str_val(doc.doc_type),
        status=_to_str_val(doc.status),
        file_size_bytes=doc.file_size_bytes,
        page_count=doc.page_count,
        created_at=doc.created_at.isoformat() if d.created_at else None,
    )


@router.get(
    "/{document_id}/extractions",
    response_model=List[ExtractionResponse],
    summary="Get extracted data from a document",
)
async def get_document_extractions(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all AI-extracted product data from a document."""
    service = DocumentIngestionService(db)
    extractions = await service.get_extractions(document_id)
    return [
        ExtractionResponse(
            id=str(e.id),
            extraction_method=e.extraction_method,
            confidence=e.confidence,
            page_number=e.page_number,
            extracted_data=e.extracted_data if isinstance(e.extracted_data, dict) else {},
            created_at=e.created_at.isoformat() if e.created_at else None,
        )
        for e in extractions
    ]


@router.post(
    "/{document_id}/process",
    summary="Manually trigger document processing",
)
async def process_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger or re-trigger AI processing for a document."""
    service = DocumentIngestionService(db)
    success = await service.trigger_processing(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document processing triggered", "document_id": document_id}


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document",
)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and all its extractions."""
    service = DocumentIngestionService(db)
    success = await service.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return None
