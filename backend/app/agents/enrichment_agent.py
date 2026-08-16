"""Enrichment Agent - specializes in filling missing product data."""

import json
from typing import Any, Dict, List, Optional

from app.agents.base_agent import BaseAgent
from app.utils.logger import get_logger

logger = get_logger(__name__)


class EnrichmentAgent(BaseAgent):
    """
    AI agent specialized in enriching product data.
    Uses cross-referencing, RAG retrieval, and domain knowledge
    to fill missing or improve existing product attributes.
    """

    def __init__(self):
        super().__init__(
            name="enrichment_agent",
            description="Fills missing product attributes and improves data quality",
        )
        self.system_prompt = (
            "You are an expert industrial product data enrichment specialist. "
            "Your task is to analyze product information and fill in missing or "
            "improve incomplete product data. You have access to:\n"
            "1. The product's current data\n"
            "2. Similar products from the catalog\n"
            "3. Manufacturer specifications\n"
            "4. Industry standard taxonomies\n\n"
            "Rules:\n"
            "- Only provide data you are confident about\n"
            "- Use industry-standard terminology\n"
            "- Follow UNSPSC and eCl@ss classification standards\n"
            "- Return confidence scores (0.0-1.0) for each field\n"
            "- NEVER invent SKUs, part numbers, or prices\n"
        )

    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute enrichment on a product.
        
        Args:
            context: {
                "product": {current product data},
                "similar_products": [list of similar products],
                "documents": [extracted document data],
                "enrichment_type": "full" | "attributes" | "description" | "category",
            }
        """
        product = context["product"]
        similar = context.get("similar_products", [])
        documents = context.get("documents", [])
        enrichment_type = context.get("enrichment_type", "full")
        
        # Build prompt
        user_prompt = self._build_prompt(product, similar, documents, enrichment_type)
        
        # Call LLM
        response = await self.call_llm(
            system_prompt=self.system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            expect_json=True,
        )
        
        # Parse result
        result = self.parse_json_response(response["text"])
        
        # Add provenance
        result["_provenance"] = {
            "agent": self.name,
            "model": "gpt-4o",
            "sources_used": [d.get("source", "unknown") for d in documents[:3]],
            "similar_products_referenced": len(similar),
        }
        
        self.add_to_memory("assistant", json.dumps(result), {"product_id": product.get("id")})
        
        return result

    def _build_prompt(
        self,
        product: Dict[str, Any],
        similar: List[Dict],
        documents: List[Dict],
        enrichment_type: str,
    ) -> str:
        """Build enrichment prompt based on type."""
        parts = [
            f"ENRICHMENT TYPE: {enrichment_type}",
            "",
            "CURRENT PRODUCT:",
            json.dumps(product, indent=2, default=str),
        ]
        
        if similar:
            parts.extend([
                "",
                "SIMILAR PRODUCTS (for reference only):",
            ])
            for i, sp in enumerate(similar[:3]):
                parts.append(f"[{i+1}] {json.dumps(sp, indent=2, default=str)[:800]}")
        
        if documents:
            parts.extend([
                "",
                "SOURCE DOCUMENTS:",
            ])
            for i, doc in enumerate(documents[:2]):
                parts.append(f"[{i+1}] {json.dumps(doc, indent=2, default=str)[:1000]}")
        
        parts.extend([
            "",
            "TASK:",
            f"Provide enriched data for this product. Return JSON with:\n"
            f"- 'changes': dict of fields that need updating\n"
            f"- 'confidence': overall confidence (0-1)\n"
            f"- 'reasoning': explanation of changes\n"
            f"- 'new_attributes': any new attributes to add\n"
        ])
        
        return "\n".join(parts)
