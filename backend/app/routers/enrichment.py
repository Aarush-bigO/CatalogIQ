"""Enrichment router - AI-powered product data enrichment."""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.enrichment_engine import EnrichmentEngine

router = APIRouter()


# ============ Schemas ============

class EnrichmentRequest(BaseModel):
    product_ids: List[str]
    enrichment_type: str = Field(default="full", pattern="^(full|attributes|description|category|pricing|relationships)$")
    priority: int = Field(default=5, ge=1, le=10)


class EnrichmentResponse(BaseModel):
    id: str
    product_id: str
    enrichment_type: str
    status: str
    ai_model: str
    fields_enriched: List[str]
    confidence_scores: Dict[str, float]
    started_at: Optional[str]
    completed_at: Optional[str]


class BatchEnrichmentResponse(BaseModel):
    message: str
    jobs_queued: int
    job_ids: List[str]


def _to_str_status(s: Any) -> str:
    if hasattr(s, "value"):
        return str(s.value)
    return str(s) if s is not None else ""


# ============ Routes ============

@router.post(
    "/batch",
    response_model=BatchEnrichmentResponse,
    summary="Queue batch enrichment for multiple products",
)
async def batch_enrich(
    request: EnrichmentRequest,
    db: AsyncSession = Depends(get_db),
):
    """Queue AI enrichment jobs for a batch of products."""
    engine = EnrichmentEngine(db)
    jobs = await engine.batch_enqueue(
        product_ids=request.product_ids,
        enrichment_type=request.enrichment_type,
        priority=request.priority,
    )
    return BatchEnrichmentResponse(
        message=f"Queued {len(jobs)} enrichment jobs",
        jobs_queued=len(jobs),
        job_ids=[str(j.id) for j in jobs],
    )


@router.get(
    "/jobs",
    summary="List enrichment jobs",
)
async def list_enrichment_jobs(
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query(None),
    product_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List AI enrichment jobs with filtering."""
    engine = EnrichmentEngine(db)
    jobs = await engine.list_jobs(
        status=status,
        product_id=product_id,
        page=page,
        page_size=page_size,
    )
    return {
        "items": [
            {
                "id": str(j.id),
                "product_id": str(j.product_id),
                "enrichment_type": j.enrichment_type,
                "status": _to_str_status(j.status),
                "ai_model": j.ai_model,
                "fields_enriched": j.fields_enriched if isinstance(j.fields_enriched, list) else [],
                "confidence_scores": j.confidence_scores if isinstance(j.confidence_scores, dict) else {},
                "started_at": j.started_at.isoformat() if j.started_at else None,
                "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            }
            for j in jobs
        ],
        "page": page,
        "page_size": page_size,
    }


@router.get(
    "/jobs/{job_id}",
    summary="Get enrichment job details",
)
async def get_enrichment_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get detailed information about an enrichment job including AI reasoning."""
    engine = EnrichmentEngine(db)
    job = await engine.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": str(job.id),
        "product_id": str(job.product_id),
        "enrichment_type": job.enrichment_type,
        "status": _to_str_status(job.status),
        "ai_model": job.ai_model,
        "prompt_template": job.prompt_template,
        "raw_llm_output": job.raw_llm_output,
        "changes_made": job.changes_made if isinstance(job.changes_made, dict) else {},
        "fields_enriched": job.fields_enriched if isinstance(job.fields_enriched, list) else [],
        "confidence_scores": job.confidence_scores if isinstance(job.confidence_scores, dict) else {},
        "sources_used": job.sources_used if isinstance(job.sources_used, list) else [],
        "rag_query": job.rag_query,
        "rag_retrieved_chunks": job.rag_retrieved_chunks if isinstance(job.rag_retrieved_chunks, list) else [],
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "tokens_input": job.tokens_input,
        "tokens_output": job.tokens_output,
    }


@router.post(
    "/jobs/{job_id}/retry",
    summary="Retry a failed enrichment job",
)
async def retry_enrichment_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retry a failed or partial enrichment job."""
    engine = EnrichmentEngine(db)
    job = await engine.retry_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "message": "Job queued for retry",
        "job_id": str(job.id),
        "status": _to_str_status(job.status),
    }


@router.get(
    "/dashboard",
    summary="Enrichment pipeline dashboard stats",
)
async def enrichment_dashboard(db: AsyncSession = Depends(get_db)):
    """Get real-time stats about the enrichment pipeline."""
    engine = EnrichmentEngine(db)
    stats = await engine.get_dashboard_stats()
    return stats
