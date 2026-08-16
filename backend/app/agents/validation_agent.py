"""Validation Agent - checks data quality and consistency."""

import json
from typing import Any, Dict, List

from app.agents.base_agent import BaseAgent
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ValidationAgent(BaseAgent):
    """
    AI agent that validates product data for consistency, accuracy, and completeness.
    Flags anomalies and suggests corrections.
    """

    def __init__(self):
        super().__init__(
            name="validation_agent",
            description="Validates product data quality and consistency",
        )
        self.system_prompt = (
            "You are a data quality validation expert for industrial product catalogs. "
            "Your job is to identify data quality issues, inconsistencies, and anomalies.\n\n"
            "Check for:\n"
            "1. Missing required fields\n"
            "2. Inconsistent units (e.g., mixing inches and mm)\n"
            "3. Implausible values (e.g., weight > 1000kg for a small part)\n"
            "4. Mismatched categories and attributes\n"
            "5. Duplicate or conflicting information\n"
            "6. Invalid formats (dates, phone numbers, URLs)\n\n"
            "Return structured JSON with identified issues and severity levels."
        )

    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate a product.
        
        Args:
            context: {
                "product": {product data},
                "category_rules": {rules for this category},
                "historical_issues": [past issues with similar products],
            }
        """
        product = context["product"]
        rules = context.get("category_rules", {})
        history = context.get("historical_issues", [])
        
        user_prompt = self._build_prompt(product, rules, history)
        
        response = await self.call_llm(
            system_prompt=self.system_prompt,
            user_prompt=user_prompt,
            temperature=0.1,
            expect_json=True,
        )
        
        result = self.parse_json_response(response["text"])
        
        result["_provenance"] = {
            "agent": self.name,
            "validation_rules_checked": len(rules),
        }
        
        return result

    def _build_prompt(
        self,
        product: Dict[str, Any],
        rules: Dict,
        history: List[Dict],
    ) -> str:
        """Build validation prompt."""
        parts = [
            "PRODUCT TO VALIDATE:",
            json.dumps(product, indent=2, default=str),
            "",
            "CATEGORY RULES:",
            json.dumps(rules, indent=2, default=str) if rules else "No specific rules",
        ]
        
        if history:
            parts.extend([
                "",
                "HISTORICAL ISSUES (similar products):",
                json.dumps(history[:5], indent=2, default=str),
            ])
        
        parts.extend([
            "",
            "Return JSON with 'issues' array. Each issue has:",
            "- 'field': affected field",
            "- 'severity': 'critical' | 'warning' | 'info'",
            "- 'message': description of issue",
            "- 'suggested_fix': how to fix it",
            "- 'confidence': 0-1",
        ])
        
        return "\n".join(parts)
