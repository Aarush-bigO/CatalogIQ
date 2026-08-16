"""Main FastAPI application entry point."""

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import ORJSONResponse

from app.config import get_settings
from app.database import close_db, get_db_session, init_db
from app.routers import (
    analytics,
    documents,
    enrichment,
    products,
    search,
    validation,
)
from app.seed import seed_if_empty
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager: startup and shutdown events."""
    # Startup
    logger.info("🚀 Starting Product Intelligence Platform...")
    logger.info(f"Environment: {settings.app_env}")
    await init_db()
    logger.info("✅ Database initialized")

    try:
        async with get_db_session() as session:
            await seed_if_empty(session)
    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)

    yield
    # Shutdown
    logger.info("🛑 Shutting down Product Intelligence Platform...")
    await close_db()
    logger.info("✅ Database connections closed")


app = FastAPI(
    title="Product Intelligence Platform API",
    description=(
        "AI-powered product intelligence for industrial commerce. "
        "Automates creation, enrichment, and validation of product data "
        "from fragmented sources using AI agents, RAG, and knowledge graphs."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

# --- Middleware ---

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def add_request_metadata(request: Request, call_next):
    """Add request timing and logging metadata."""
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", "unknown")

    response = await call_next(request)

    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Request-ID"] = request_id

    return response


# --- Health & Root ---

@app.get("/health", tags=["Health"], status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.app_env,
    }


@app.get("/", tags=["Root"], include_in_schema=False)
async def root():
    """Root redirect to API documentation."""
    return {
        "message": "Product Intelligence Platform API",
        "documentation": "/docs",
    }


# --- Routers ---

app.include_router(products, prefix="/api/v1/products", tags=["Products"])
app.include_router(documents, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(search, prefix="/api/v1/search", tags=["Search"])
app.include_router(enrichment, prefix="/api/v1/enrichment", tags=["Enrichment"])
app.include_router(validation, prefix="/api/v1/validation", tags=["Validation"])
app.include_router(analytics, prefix="/api/v1/analytics", tags=["Analytics"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.app_host, port=settings.app_port, reload=settings.debug)
