"""Product API router."""

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product import ProductStatus
from app.services.product_service import ProductService
from pydantic import BaseModel, Field

router = APIRouter()


# ============ Request/Response Schemas ============

class ProductCreate(BaseModel):
    sku: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    manufacturer: Optional[str] = None
    currency: Optional[str] = "USD"
    list_price: Optional[float] = None
    cost_price: Optional[float] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    specifications: Dict[str, Any] = Field(default_factory=dict)
    source_catalog: Optional[str] = None
    source_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    manufacturer: Optional[str] = None
    currency: Optional[str] = None
    list_price: Optional[float] = None
    cost_price: Optional[float] = None
    attributes: Optional[Dict[str, Any]] = None
    specifications: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    sku: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    manufacturer: Optional[str] = None
    currency: Optional[str] = "USD"
    list_price: Optional[float] = None
    cost_price: Optional[float] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    specifications: Dict[str, Any] = Field(default_factory=dict)
    status: str = "draft"
    quality_score: Optional[float] = 0.0
    confidence_score: Optional[float] = 0.0
    completeness_score: Optional[float] = 0.0
    source_catalog: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============ Routes ============

@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new product entry."""
    service = ProductService(db)
    prod_dict = data.model_dump()
    prod_dict["id"] = str(uuid.uuid4())
    product = await service.create_product(prod_dict)
    return product.to_dict()


@router.get(
    "/",
    response_model=ProductListResponse,
    summary="List products with filtering and pagination",
)
async def list_products(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_quality: Optional[float] = Query(None, ge=0, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
):
    """List products with advanced filtering, search, and pagination."""
    service = ProductService(db)
    result = await service.list_products(
        page=page,
        page_size=page_size,
        status=status,
        category=category,
        search=search,
        min_quality=min_quality,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return {
        "items": [p.to_dict() for p in result["items"]],
        "total": result["total"],
        "page": page,
        "page_size": page_size,
        "pages": max(1, (result["total"] + page_size - 1) // page_size),
    }


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get a single product by ID",
)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a product by its ID."""
    service = ProductService(db)
    product = await service.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product.to_dict()


@router.patch(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update a product",
)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing product's fields."""
    service = ProductService(db)
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    product = await service.update_product(product_id, update_data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product.to_dict()


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product",
)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a product and its associated data."""
    service = ProductService(db)
    success = await service.delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return None


@router.get(
    "/{product_id}/relationships",
    summary="Get product relationships from knowledge graph",
)
async def get_product_relationships(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    relationship_type: Optional[str] = Query(None),
):
    """Retrieve relationships for a product."""
    service = ProductService(db)
    relationships = await service.get_relationships(
        product_id, relationship_type=relationship_type
    )
    return {"relationships": relationships}


@router.post(
    "/{product_id}/enrich",
    summary="Trigger AI enrichment for a product",
)
async def enrich_product(
    product_id: str,
    enrichment_type: str = Query("full", enum=["full", "attributes", "description", "category", "pricing", "relationships"]),
    db: AsyncSession = Depends(get_db),
):
    """Queue an AI enrichment job for the specified product."""
    from app.services.enrichment_engine import EnrichmentEngine

    engine = EnrichmentEngine(db)
    job = await engine.queue_enrichment(product_id, enrichment_type)
    return {
        "message": "Enrichment queued",
        "job_id": str(job.id),
        "product_id": product_id,
        "enrichment_type": enrichment_type,
    }


@router.get(
    "/stats/overview",
    summary="Get product catalog statistics",
)
async def get_product_stats(db: AsyncSession = Depends(get_db)):
    """Aggregate statistics about the product catalog."""
    service = ProductService(db)
    stats = await service.get_stats()
    return stats
