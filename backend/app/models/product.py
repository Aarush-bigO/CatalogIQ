"""Product ORM models."""

import enum
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


class ProductStatus(str, enum.Enum):
    DRAFT = "draft"
    ENRICHING = "enriching"
    PENDING_VALIDATION = "pending_validation"
    VALIDATED = "validated"
    REJECTED = "rejected"
    PUBLISHED = "published"


class Product(Base):
    """Core product entity with flexible attribute storage."""

    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_sku", "sku"),
        Index("ix_products_status", "status"),
        Index("ix_products_category", "category"),
        Index("ix_products_quality_score", "quality_score"),
        Index("ix_products_created_at", "created_at"),
        UniqueConstraint("sku", "source_catalog", name="uix_product_sku_catalog"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=new_uuid
    )
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    subcategory: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Pricing
    currency: Mapped[Optional[str]] = mapped_column(String(3), nullable=True)
    list_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cost_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Media
    primary_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_urls: Mapped[Optional[str]] = mapped_column(JSON, default="[]")
    
    # Flexible attributes (JSON for schema-less product data)
    attributes: Mapped[Optional[str]] = mapped_column(JSON, default="{}")
    specifications: Mapped[Optional[str]] = mapped_column(JSON, default="{}")
    
    # Taxonomy & Classification
    hs_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    unspsc_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Quality & Workflow
    status: Mapped[str] = mapped_column(
        String(30), default=ProductStatus.DRAFT.value, nullable=False
    )
    quality_score: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    completeness_score: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    
    # Source tracking
    source_catalog: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_documents: Mapped[Optional[str]] = mapped_column(JSON, default="[]")
    
    # Metadata
    tags: Mapped[Optional[str]] = mapped_column(JSON, default="[]")
    language: Mapped[str] = mapped_column(String(10), default="en")
    
    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    enriched_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    validated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    document_extractions = relationship(
        "DocumentExtraction", back_populates="product", lazy="selectin"
    )
    enrichment_runs = relationship(
        "EnrichmentRun", back_populates="product", lazy="selectin"
    )
    validations = relationship(
        "ProductValidation", back_populates="product", lazy="selectin"
    )

    def to_dict(self) -> Dict[str, Any]:
        """Serialize product to dictionary."""
        return {
            "id": self.id,
            "sku": self.sku,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "subcategory": self.subcategory,
            "brand": self.brand,
            "manufacturer": self.manufacturer,
            "currency": self.currency,
            "list_price": self.list_price,
            "cost_price": self.cost_price,
            "primary_image_url": self.primary_image_url,
            "image_urls": self.image_urls if isinstance(self.image_urls, list) else [],
            "attributes": self.attributes if isinstance(self.attributes, dict) else {},
            "specifications": self.specifications if isinstance(self.specifications, dict) else {},
            "hs_code": self.hs_code,
            "unspsc_code": self.unspsc_code,
            "status": self.status if isinstance(self.status, str) else self.status.value,
            "quality_score": self.quality_score,
            "confidence_score": self.confidence_score,
            "completeness_score": self.completeness_score,
            "source_catalog": self.source_catalog,
            "source_url": self.source_url,
            "source_documents": self.source_documents if isinstance(self.source_documents, list) else [],
            "tags": self.tags if isinstance(self.tags, list) else [],
            "language": self.language,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "enriched_at": self.enriched_at.isoformat() if self.enriched_at else None,
            "validated_at": self.validated_at.isoformat() if self.validated_at else None,
        }


class ProductAlias(Base):
    """Alternative names / SKUs for products (for deduplication)."""

    __tablename__ = "product_aliases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    alias_type: Mapped[str] = mapped_column(String(50), nullable=False)
    alias_value: Mapped[str] = mapped_column(String(500), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    source: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)


class ProductRelationship(Base):
    """Relationships between products in the graph."""

    __tablename__ = "product_relationships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    source_product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    target_product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    metadata_json: Mapped[Optional[str]] = mapped_column(JSON, default="{}")
    inferred_by_ai: Mapped[bool] = mapped_column(Boolean, default=False)
    validated_by_human: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
