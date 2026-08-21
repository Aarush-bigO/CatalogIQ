"""Router exports."""
from app.routers.analytics import router as analytics
from app.routers.chat import router as chat
from app.routers.documents import router as documents
from app.routers.enrichment import router as enrichment
from app.routers.products import router as products
from app.routers.search import router as search
from app.routers.validation import router as validation

__all__ = ["products", "documents", "search", "enrichment", "validation", "analytics", "chat"]

