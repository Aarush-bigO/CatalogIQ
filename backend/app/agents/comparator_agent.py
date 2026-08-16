"""Comparator Agent - benchmarks products against competitors and standards."""

import json
from typing import Any, Dict, List

from app.agents.base_agent import BaseAgent


class ComparatorAgent(BaseAgent):
    """
    AI agent that compares products against competitor catalogs
    and industry standards to identify gaps and opportunities.
    """

    def __init__(self):
        super().__init__(
            name="comparator_agent",
            description="Compares products against competitors and benchmarks",
        )
        self.system_prompt = (
            "You are a competitive intelligence analyst for industrial products. "
            "Compare the given product against market standards and competitors.\n\n"
            "Analyze:\n"
            "1. Missing specifications vs industry standard\n"
            "2. Pricing position (if available)\n"
            "3. Feature gaps\n"
            "4. Certification gaps\n"
            "5. Description quality vs best-in-class\n\n"
            "Be objective and data-driven."
        )

    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compare a product against benchmarks.
        
        Args:
            context: {
                "product": {product data},
                "competitor_products": [similar competitor products],
                "industry_standards": {standard attributes for category},
            }
        """
        product = context["product"]
        competitors = context.get("competitor_products", [])
        standards = context.get("industry_standards", {})
        
        user_prompt = self._build_prompt(product, competitors, standards)
        
        response = await self.call_llm(
            system_prompt=self.system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            expect_json=True,
        )
        
        result = self.parse_json_response(response["text"])
        result["_provenance"] = {
            "agent": self.name,
            "competitors_analyzed": len(competitors),
        }
        
        return result

    def _build_prompt(
        self,
        product: Dict[str, Any],
        competitors: List[Dict],
        standards: Dict,
    ) -> str:
        """Build comparison prompt."""
        parts = [
            "PRODUCT:",
            json.dumps(product, indent=2, default=str),
            "",
            "INDUSTRY STANDARDS:",
            json.dumps(standards, indent=2, default=str) if standards else "No standards provided",
        ]
        
        if competitors:
            parts.extend([
                "",
                "COMPETITOR PRODUCTS:",
            ])
            for i, comp in enumerate(competitors[:3]):
                parts.append(f"[{i+1}] {json.dumps(comp, indent=2, default=str)[:600]}")
        
        parts.extend([
            "",
            "Return JSON with:",
            "- 'gaps': missing specs vs standards",
            "- 'advantages': where product exceeds standards",
            "- 'disadvantages': where product falls short",
            "- 'recommendations': specific improvements",
            "- 'overall_score': 0-100",
        ])
        
        return "\n".join(parts)
