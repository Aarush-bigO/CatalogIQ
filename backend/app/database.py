"""Database session management — SQLite-first for local development."""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from app.config import get_settings

settings = get_settings()

# Ensure data directory exists
db_dir = os.path.dirname(settings.database_path)
if db_dir:
    os.makedirs(db_dir, exist_ok=True)

# Create async engine (SQLite)
engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    connect_args={"check_same_thread": False},
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Base class for ORM models
Base = declarative_base()


async def init_db() -> None:
    """Create all tables based on ORM models."""
    # Import models so they register with Base.metadata
    import app.models.product  # noqa: F401
    import app.models.document  # noqa: F401
    import app.models.enrichment  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Dispose the database engine."""
    await engine.dispose()


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database sessions."""
    session = AsyncSessionLocal()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database sessions."""
    async with get_db_session() as session:
        yield session
