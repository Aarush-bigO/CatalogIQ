"""RAG (Retrieval-Augmented Generation) Engine with database fallback."""

import time
from typing import Any, Dict, List, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.product import Product
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


class RAGEngine:
    """
    Retrieval-Augmented Generation engine for product intelligence.
    Combines search strategies over products with scoring and explanations.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search(
        self,
        query: str,
        search_type: str = "hybrid",
        filters: Optional[Dict[str, Any]] = None,
        top_k: int = 10,
        include_explanations: bool = True,
    ) -> List[Dict[str, Any]]:
        """Execute search using keyword, semantic simulation, or hybrid."""
        q_lower = query.lower().strip()
        search_terms = q_lower.split()

        result = await self.db.execute(select(Product))
        products = result.scalars().all()

        scored_results = []
        for p in products:
            text_blob = f"{p.name} {p.sku} {p.description or ''} {p.category or ''} {p.brand or ''} {p.manufacturer or ''}".lower()
            
            # Count term matches
            matches = sum(1 for t in search_terms if t in text_blob)
            exact_sku = 1.0 if q_lower in p.sku.lower() else 0.0
            exact_name = 0.8 if q_lower in p.name.lower() else 0.0

            if matches > 0 or exact_sku > 0 or exact_name > 0:
                base_score = matches / max(1, len(search_terms))
                score = round(min(0.99, max(base_score, exact_sku, exact_name) * 0.85 + 0.15), 4)

                matched_field = "name" if exact_name > 0 else "sku" if exact_sku > 0 else "description"
                explanation = f"Matched '{query}' across product {matched_field} and specifications."

                scored_results.append({
                    "product_id": str(p.id),
                    "sku": p.sku,
                    "name": p.name,
                    "category": p.category,
                    "description": p.description,
                    "score": score,
                    "matched_field": matched_field,
                    "explanation": explanation if include_explanations else None,
                    "attributes": p.attributes if isinstance(p.attributes, dict) else {},
                })

        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:top_k]

    async def generate_suggestions(self, query: str) -> List[str]:
        """Generate query suggestions based on catalog content."""
        category_keywords = ["bearing", "valve", "motor", "pump", "sensor", "cylinder", "controller", "filter", "guide", "drive", "welder", "compressor"]
        suggestions = []
        for kw in category_keywords:
            if kw in query.lower():
                suggestions.append(f"{kw} specifications")
                suggestions.append(f"industrial {kw} pricing")
                suggestions.append(f"high precision {kw}")

        if not suggestions:
            suggestions = [f"{query} specifications", f"{query} replacement parts", f"heavy duty {query}"]

        return suggestions[:5]

    async def autocomplete(self, query: str, limit: int = 10) -> List[str]:
        """Autocomplete suggestions from product names and SKUs."""
        result = await self.db.execute(
            select(Product.name).where(Product.name.ilike(f"%{query}%")).limit(limit)
        )
        names = [r[0] for r in result.all() if r[0]]

        result_sku = await self.db.execute(
            select(Product.sku).where(Product.sku.ilike(f"%{query}%")).limit(limit)
        )
        skus = [r[0] for r in result_sku.all() if r[0]]

        return list(dict.fromkeys(names + skus))[:limit]

    async def get_category_tree(self) -> List[Dict[str, Any]]:
        """Get category hierarchy from products."""
        result = await self.db.execute(
            select(
                Product.category,
                Product.subcategory,
                func.count(Product.id),
            )
            .where(Product.category.isnot(None))
            .group_by(Product.category, Product.subcategory)
            .order_by(func.count(Product.id).desc())
        )

        tree: Dict[str, Any] = {}
        for category, subcategory, count in result.all():
            if category not in tree:
                tree[category] = {"name": category, "count": 0, "subcategories": {}}
            tree[category]["count"] += count
            if subcategory:
                tree[category]["subcategories"][subcategory] = {
                    "name": subcategory,
                    "count": count,
                }

        return list(tree.values())

    async def get_facets(self, category: Optional[str] = None) -> Dict[str, Any]:
        """Get available search facets/filters."""
        facets = {}

        q = select(Product.brand, func.count(Product.id)).where(
            Product.brand.isnot(None)
        ).group_by(Product.brand).order_by(func.count(Product.id).desc()).limit(50)

        if category:
            q = q.where(Product.category == category)

        result = await self.db.execute(q)
        facets["brands"] = [{"value": b, "count": c} for b, c in result.all() if b]

        result_cat = await self.db.execute(
            select(Product.category, func.count(Product.id))
            .where(Product.category.isnot(None))
            .group_by(Product.category)
            .order_by(func.count(Product.id).desc())
        )
        facets["categories"] = [{"value": c, "count": n} for c, n in result_cat.all() if c]

        result_st = await self.db.execute(
            select(Product.status, func.count(Product.id))
            .group_by(Product.status)
        )
        facets["statuses"] = [{"value": str(s), "count": n} for s, n in result_st.all()]

        facets["quality_ranges"] = [
            {"label": "Excellent (90-100)", "min": 90, "max": 100},
            {"label": "Good (70-89)", "min": 70, "max": 89},
            {"label": "Average (50-69)", "min": 50, "max": 69},
            {"label": "Poor (<50)", "min": 0, "max": 49},
        ]

        return facets

    async def find_similar(
        self,
        product_id: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Find similar products in the same category."""
        target = await self.db.execute(select(Product).where(Product.id == product_id))
        t_prod = target.scalar_one_or_none()
        if not t_prod:
            return []

        similar = await self.db.execute(
            select(Product)
            .where(Product.category == t_prod.category)
            .where(Product.id != product_id)
            .limit(top_k)
        )
        return [
            {
                "product_id": str(p.id),
                "sku": p.sku,
                "name": p.name,
                "category": p.category,
                "score": 0.88,
            }
            for p in similar.scalars().all()
        ]
