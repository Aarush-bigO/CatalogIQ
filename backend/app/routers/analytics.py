"""Analytics router - dashboards and reporting."""

from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.product_service import ProductService

router = APIRouter()


def _str_status(s: Any) -> str:
    if hasattr(s, "value"):
        return str(s.value)
    return str(s) if s is not None else ""


@router.get(
    "/dashboard",
    summary="Main analytics dashboard",
)
async def analytics_dashboard(db: AsyncSession = Depends(get_db)):
    """Get comprehensive analytics for the product intelligence dashboard."""
    service = ProductService(db)

    stats = await service.get_stats()

    # Add enrichment stats
    from sqlalchemy import func, select
    from app.models.enrichment import EnrichmentRun
    from app.models.document import ProcessingStatus, SourceDocument
    from app.models.enrichment import ProductValidation, ValidationStatus

    # Document processing stats
    doc_stats = await db.execute(
        select(
            SourceDocument.status,
            func.count(SourceDocument.id),
        ).group_by(SourceDocument.status)
    )
    doc_status_counts = {_str_status(s): c for s, c in doc_stats.all()}

    # Enrichment stats
    enrich_stats = await db.execute(
        select(
            EnrichmentRun.status,
            func.count(EnrichmentRun.id),
        ).group_by(EnrichmentRun.status)
    )
    enrich_status_counts = {_str_status(s): c for s, c in enrich_stats.all()}

    # Validation queue stats
    val_stats = await db.execute(
        select(
            ProductValidation.status,
            func.count(ProductValidation.id),
        ).group_by(ProductValidation.status)
    )
    val_status_counts = {_str_status(s): c for s, c in val_stats.all()}

    return {
        "products": stats,
        "documents": {
            "status_breakdown": doc_status_counts,
            "total": sum(doc_status_counts.values()),
        },
        "enrichment": {
            "status_breakdown": enrich_status_counts,
            "total_jobs": sum(enrich_status_counts.values()),
        },
        "validation": {
            "status_breakdown": val_status_counts,
            "pending_reviews": val_status_counts.get("pending", 0),
        },
    }


@router.get(
    "/quality-trend",
    summary="Product quality score trends over time",
)
async def quality_trend(
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
):
    """Get average quality scores aggregated by day."""
    from sqlalchemy import func, select
    from app.models.product import Product
    from datetime import datetime, timedelta

    cutoff = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            func.date(Product.created_at).label("date"),
            func.avg(Product.quality_score).label("avg_quality"),
            func.count(Product.id).label("count"),
        )
        .where(Product.created_at >= cutoff)
        .group_by(func.date(Product.created_at))
        .order_by(func.date(Product.created_at))
    )

    rows = result.all()
    return {
        "days": days,
        "data": [
            {
                "date": str(r.date),
                "avg_quality": round(r.avg_quality or 0, 2),
                "product_count": r.count,
            }
            for r in rows
        ],
    }


@router.get(
    "/category-distribution",
    summary="Product distribution by category",
)
async def category_distribution(db: AsyncSession = Depends(get_db)):
    """Get product counts and avg quality per category."""
    from sqlalchemy import func, select
    from app.models.product import Product

    result = await db.execute(
        select(
            Product.category,
            func.count(Product.id).label("count"),
            func.avg(Product.quality_score).label("avg_quality"),
            func.avg(Product.completeness_score).label("avg_completeness"),
        )
        .where(Product.category.isnot(None))
        .group_by(Product.category)
        .order_by(func.count(Product.id).desc())
    )

    rows = result.all()
    return {
        "categories": [
            {
                "category": r.category,
                "count": r.count,
                "avg_quality": round(r.avg_quality or 0, 2),
                "avg_completeness": round(r.avg_completeness or 0, 2),
            }
            for r in rows
        ],
    }
