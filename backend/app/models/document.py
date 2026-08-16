"""Document ingestion and extraction models."""

import enum
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


class DocumentType(str, enum.Enum):
    PDF = "pdf"
    IMAGE = "image"
    EXCEL = "excel"
    CSV = "csv"
    WORD = "word"
    WEBPAGE = "webpage"
    CATALOG = "catalog"
    TECHNICAL_SHEET = "technical_sheet"
    UNKNOWN = "unknown"


class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    UPLOADED = "uploaded"
    EXTRACTING = "extracting"
    OCR_RUNNING = "ocr_running"
    AI_ANALYZING = "ai_analyzing"
    COMPLETED = "completed"
    FAILED = "failed"
    QUEUED_FOR_ENRICHMENT = "queued_for_enrichment"


class SourceDocument(Base):
    """Raw uploaded document (PDF, image, etc.)."""

    __tablename__ = "source_documents"
    __table_args__ = (
        Index("ix_source_documents_status", "status"),
        Index("ix_source_documents_doc_type", "doc_type"),
        Index("ix_source_documents_created_at", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    doc_type: Mapped[str] = mapped_column(
        String(30), default=DocumentType.UNKNOWN.value, nullable=False
    )
    
    # Source info
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    uploaded_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    catalog_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Processing
    status: Mapped[str] = mapped_column(
        String(30), default=ProcessingStatus.PENDING.value, nullable=False
    )
    processing_metadata: Mapped[Optional[str]] = mapped_column(JSON, default="{}")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    extractions = relationship(
        "DocumentExtraction", back_populates="source_document", lazy="selectin", cascade="all, delete-orphan"
    )
    ocr_results = relationship(
        "OCRResult", back_populates="source_document", lazy="selectin", cascade="all, delete-orphan"
    )
    page_images = relationship(
        "DocumentPageImage", back_populates="source_document", lazy="selectin", cascade="all, delete-orphan"
    )


class DocumentExtraction(Base):
    """Structured data extracted from a document, linked to a product."""

    __tablename__ = "document_extractions"
    __table_args__ = (
        Index("ix_document_extractions_product_id", "product_id"),
        Index("ix_document_extractions_confidence", "confidence"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    source_document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_documents.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    
    extraction_method: Mapped[str] = mapped_column(String(50), nullable=False)
    extracted_data: Mapped[Optional[str]] = mapped_column(JSON, default="{}")
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Provenance
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bounding_box: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    
    source_document = relationship("SourceDocument", back_populates="extractions")
    product = relationship("Product", back_populates="document_extractions")


class OCRResult(Base):
    """OCR text extraction per page/region."""

    __tablename__ = "ocr_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    source_document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_documents.id", ondelete="CASCADE"), nullable=False
    )
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    ocr_text: Mapped[str] = mapped_column(Text, nullable=False)
    ocr_engine: Mapped[str] = mapped_column(String(50), default="tesseract")
    confidence_avg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="eng")
    processing_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    
    source_document = relationship("SourceDocument", back_populates="ocr_results")


class DocumentPageImage(Base):
    """Individual page images extracted from PDFs for VLM processing."""

    __tablename__ = "document_page_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    source_document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_documents.id", ondelete="CASCADE"), nullable=False
    )
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    image_path: Mapped[str] = mapped_column(Text, nullable=False)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    dpi: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    
    source_document = relationship("SourceDocument", back_populates="page_images")
