"""Enrichment worker - processes AI enrichment jobs."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.enrichment import EnrichmentRun, EnrichmentStatus
from app.services.enrichment_engine import EnrichmentEngine
from app.utils.logger import configure_logging, get_logger

configure_logging()
logger = get_logger("enrichment_worker")
settings = get_settings()


async def process_enrichment_job(job_id: str) -> None:
    """Process a single enrichment job."""
    async with AsyncSessionLocal() as db:
        engine = EnrichmentEngine(db)
        await engine.run_enrichment(job_id)


async def poll_and_process() -> None:
    """Poll for queued enrichment jobs and process them."""
    from sqlalchemy import select
    
    logger.info("Enrichment worker started")
    
    while True:
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(EnrichmentRun)
                    .where(EnrichmentRun.status == EnrichmentStatus.QUEUED)
                    .limit(1)
                )
                job = result.scalar_one_or_none()
                
                if job:
                    logger.info(f"Processing enrichment job: {job.id}")
                    await process_enrichment_job(job.id)
                else:
                    await asyncio.sleep(5)
                    
        except Exception as e:
            logger.error(f"Enrichment worker error: {e}")
            await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(poll_and_process())
