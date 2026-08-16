"""Search router - semantic + keyword + hybrid search."""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.rag_engine import RAGEngine
from app.services.embedding_service import EmbeddingService

router = APIRouter()


# ============ Schemas ============

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    search_type: str = Field(default="hybrid", pattern="^(semantic|keyword|hybrid|graph)$")
    filters: Dict[str, Any] = Field(default_factory=dict)
    top_k: int = Field(default=10, ge=1, le=100)
    include_explanations: bool = Field(default=True)


class SearchResultItem(BaseModel):
    product_id: str
    sku: str
    name: str
    category: Optional[str]
    description: Optional[str]
    score: float
    matched_field: Optional[str]
    explanation: Optional[str]
    attributes: Dict[str, Any]


class SearchResponse(BaseModel):
    query: str
    search_type: str
    total_results: int
    results: List[SearchResultItem]
    execution_time_ms: float
    suggested_queries: List[str]


class SimilarProductsRequest(BaseModel):
    product_id: str
    top_k: int = Field(default=5, ge=1, le=20)


# ============ Routes ============

@router.post(
    "/",
    response_model=SearchResponse,
    summary="Semantic / keyword / hybrid search across products",
)
async def search_products(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Search the product catalog using:
    - **semantic**: Vector similarity via embeddings
    - **keyword**: Full-text search on name, description, SKU
    - **hybrid**: Combined semantic + keyword with reranking
    - **graph**: Knowledge graph traversal for related products
    """
    import time
    start = time.time()

    rag = RAGEngine(db)
    results = await rag.search(
        query=request.query,
        search_type=request.search_type,
        filters=request.filters,
        top_k=request.top_k,
        include_explanations=request.include_explanations,
    )

    execution_time = (time.time() - start) * 1000

    # Generate suggested queries
    suggested = await rag.generate_suggestions(request.query)

    return SearchResponse(
        query=request.query,
        search_type=request.search_type,
        total_results=len(results),
        results=results,
        execution_time_ms=round(execution_time, 2),
        suggested_queries=suggested,
    )


@router.get(
    "/autocomplete",
    summary="Autocomplete suggestions for search box",
)
async def autocomplete(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Get autocomplete suggestions based on partial query."""
    rag = RAGEngine(db)
    suggestions = await rag.autocomplete(q, limit=limit)
    return {"query": q, "suggestions": suggestions}


@router.post(
    "/similar",
    summary="Find similar products by product ID",
)
async def find_similar_products(
    request: SimilarProductsRequest,
    db: AsyncSession = Depends(get_db),
):
    """Find semantically similar products to a given product."""
    rag = RAGEngine(db)
    results = await rag.find_similar(
        product_id=request.product_id,
        top_k=request.top_k,
    )
    return {
        "product_id": request.product_id,
        "similar_products": results,
    }


@router.get(
    "/category-tree",
    summary="Get product category hierarchy",
)
async def get_category_tree(db: AsyncSession = Depends(get_db)):
    """Retrieve the category/subcategory hierarchy from the knowledge graph."""
    rag = RAGEngine(db)
    tree = await rag.get_category_tree()
    return {"categories": tree}


@router.get(
    "/facets",
    summary="Get search facets / filters",
)
async def get_search_facets(
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get available filter facets for the search interface."""
    rag = RAGEngine(db)
    facets = await rag.get_facets(category=category)
    return {"facets": facets}
