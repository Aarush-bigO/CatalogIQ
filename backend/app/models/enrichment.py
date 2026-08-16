"""Enrichment and validation models."""

import enum
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


class EnrichmentStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class EnrichmentRun(Base):
    """Tracks an AI enrichment execution on a product."""

    __tablename__ = "enrichment_runs"
    __table_args__ = (
        Index("ix_enrichment_runs_product_id", "product_id"),
        Index("ix_enrichment_runs_status", "status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    
    enrichment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    status: Mapped[str] = mapped_column(
        String(30), default=EnrichmentStatus.QUEUED.value, nullable=False
    )
    
    # AI reasoning
    ai_model: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_llm_output: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Results
    changes_made: Mapped[Optional[str]] = mapped_column(JSON, default="{}")
    fields_enriched: Mapped[Optional[str]] = mapped_column(JSON, default="[]")
    confidence_scores: Mapped[Optional[str]] = mapped_column(JSON, default="{}")
    sources_used: Mapped[Optional[str]] = mapped_column(JSON, default="[]")
    
    # RAG context
    rag_query: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rag_retrieved_chunks: Mapped[Optional[str]] = mapped_column(JSON, default="[]")
    
    # Timing & cost
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    tokens_input: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tokens_output: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="enrichment_runs")


class ValidationStatus(str, enum.Enum):
    PENDING = "pending"
    AUTO_PASSED = "auto_passed"
    AUTO_FAILED = "auto_failed"
    HUMAN_REVIEWING = "human_reviewing"
    HUMAN_APPROVED = "human_approved"
    HUMAN_REJECTED = "human_rejected"


class ProductValidation(Base):
    """Human-in-the-loop validation records for product data."""

    __tablename__ = "product_validations"
    __table_args__ = (
        Index("ix_product_validations_product_id", "product_id"),
        Index("ix_product_validations_status", "status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    
    field_name: Mapped[str] = mapped_column(String(200), nullable=False)
    field_path: Mapped[str] = mapped_column(String(500), nullable=False)
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    proposed_value: Mapped[str] = mapped_column(Text, nullable=False)
    
    # AI assessment
    ai_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    ai_reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_suggested_action: Mapped[str] = mapped_column(String(50), default="review")
    
    # Human review
    status: Mapped[str] = mapped_column(
        String(30), default=ValidationStatus.PENDING.value, nullable=False
    )
    reviewer_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    reviewer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    priority: Mapped[int] = mapped_column(Integer, default=5)
    
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="validations")


class ValidationRule(Base):
    """Configurable validation rules for product data quality."""

    __tablename__ = "validation_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    field_path: Mapped[str] = mapped_column(String(500), nullable=False)
    parameters: Mapped[Optional[str]] = mapped_column(JSON, default="{}")
    
    severity: Mapped[str] = mapped_column(String(20), default="error")
    auto_fix: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_fix_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    applies_to_categories: Mapped[Optional[str]] = mapped_column(JSON, default="[]")
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
