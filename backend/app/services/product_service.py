"""Product business logic service."""

import uuid
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product, ProductRelationship, ProductStatus
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _to_str(val: Any) -> str:
    if hasattr(val, "value"):
        return str(val.value)
    return str(val) if val is not None else ""


class ProductService:
    """Handles product CRUD, search, and catalog management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_product(self, data: Dict[str, Any]) -> Product:
        """Create a new product record."""
        product = Product(**data)
        self.db.add(product)
        await self.db.flush()
        await self.db.refresh(product)
        logger.info(f"Created product {product.id} (SKU: {product.sku})")
        return product

    async def get_product(self, product_id: Union[uuid.UUID, str]) -> Optional[Product]:
        """Retrieve a product by ID."""
        pid = str(product_id)
        result = await self.db.execute(
            select(Product).where(Product.id == pid)
        )
        return result.scalar_one_or_none()

    async def get_product_by_sku(self, sku: str) -> Optional[Product]:
        """Retrieve a product by SKU."""
        result = await self.db.execute(
            select(Product).where(Product.sku == sku)
        )
        return result.scalar_one_or_none()

    async def update_product(
        self, product_id: Union[uuid.UUID, str], data: Dict[str, Any]
    ) -> Optional[Product]:
        """Update a product's fields."""
        product = await self.get_product(product_id)
        if not product:
            return None

        for key, value in data.items():
            if hasattr(product, key):
                if key == "status" and hasattr(value, "value"):
                    value = value.value
                setattr(product, key, value)

        await self.db.flush()
        await self.db.refresh(product)
        logger.info(f"Updated product {product_id}")
        return product

    async def delete_product(self, product_id: Union[uuid.UUID, str]) -> bool:
        """Delete a product."""
        product = await self.get_product(product_id)
        if not product:
            return False

        await self.db.delete(product)
        await self.db.flush()
        logger.info(f"Deleted product {product_id}")
        return True

    async def list_products(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[Union[ProductStatus, str]] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        min_quality: Optional[float] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Dict[str, Any]:
        """List products with filtering, search, and pagination."""
        query = select(Product)

        # Apply filters
        filters = []
        if status:
            st = status.value if hasattr(status, "value") else str(status)
            filters.append(Product.status == st)
        if category:
            filters.append(Product.category.ilike(f"%{category}%"))
        if min_quality is not None:
            filters.append(Product.quality_score >= min_quality)
        if search:
            search_filter = or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
                Product.brand.ilike(f"%{search}%"),
            )
            filters.append(search_filter)

        if filters:
            query = query.where(and_(*filters))

        # Sorting
        sort_column = getattr(Product, sort_by, Product.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)

        # Count total
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar() or 0

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        items = result.scalars().all()

        return {"items": list(items), "total": total}

    async def get_relationships(
        self,
        product_id: Union[uuid.UUID, str],
        relationship_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get product relationships from the graph."""
        pid = str(product_id)
        query = select(ProductRelationship).where(
            or_(
                ProductRelationship.source_product_id == pid,
                ProductRelationship.target_product_id == pid,
            )
        )
        if relationship_type:
            query = query.where(ProductRelationship.relationship_type == relationship_type)

        result = await self.db.execute(query)
        relationships = result.scalars().all()

        return [
            {
                "id": str(r.id),
                "relationship_type": r.relationship_type,
                "source_product_id": str(r.source_product_id),
                "target_product_id": str(r.target_product_id),
                "confidence": r.confidence,
                "inferred_by_ai": r.inferred_by_ai,
                "validated_by_human": r.validated_by_human,
            }
            for r in relationships
        ]

    async def update_quality_scores(self, product_id: Union[uuid.UUID, str]) -> None:
        """Recalculate quality, confidence, and completeness scores."""
        product = await self.get_product(product_id)
        if not product:
            return

        # Completeness: percentage of core fields filled
        core_fields = ["name", "description", "category", "brand", "manufacturer", "list_price"]
        filled = sum(1 for f in core_fields if getattr(product, f) is not None)
        product.completeness_score = (filled / len(core_fields)) * 100

        # Quality: weighted average of completeness and confidence
        product.quality_score = (
            (product.completeness_score or 0) * 0.5 +
            (product.confidence_score or 0) * 0.3 +
            (100 if product.validated_at else 50) * 0.2
        )

        await self.db.flush()
        logger.info(f"Updated quality scores for product {product_id}: {product.quality_score:.1f}")

    async def get_stats(self) -> Dict[str, Any]:
        """Get aggregate statistics about the product catalog."""
        total_result = await self.db.execute(select(func.count()).select_from(Product))
        total = total_result.scalar() or 0

        # Status breakdown
        status_result = await self.db.execute(
            select(Product.status, func.count(Product.id))
            .group_by(Product.status)
        )
        status_counts = {_to_str(s): c for s, c in status_result.all()}

        # Quality distribution
        quality_ranges = [
            ("excellent", 90, 100),
            ("good", 70, 89),
            ("average", 50, 69),
            ("poor", 0, 49),
        ]
        quality_distribution = {}
        for label, low, high in quality_ranges:
            count_result = await self.db.execute(
                select(func.count()).select_from(Product)
                .where(Product.quality_score >= low)
                .where(Product.quality_score <= high)
            )
            quality_distribution[label] = count_result.scalar() or 0

        # Category count
        category_result = await self.db.execute(
            select(func.count(func.distinct(Product.category))).select_from(Product)
        )
        category_count = category_result.scalar() or 0

        # Averages
        avg_result = await self.db.execute(
            select(
                func.avg(Product.quality_score),
                func.avg(Product.confidence_score),
                func.avg(Product.completeness_score),
            )
        )
        avg_quality, avg_confidence, avg_completeness = avg_result.one()

        return {
            "total_products": total,
            "status_breakdown": status_counts,
            "quality_distribution": quality_distribution,
            "category_count": category_count,
            "avg_quality_score": round(avg_quality or 0, 2),
            "avg_confidence_score": round(avg_confidence or 0, 2),
            "avg_completeness_score": round(avg_completeness or 0, 2),
        }
