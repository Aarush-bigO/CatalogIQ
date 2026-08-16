"""Validation Engine - automated rules + human-in-the-loop validation."""

import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.enrichment import ProductValidation, ValidationRule, ValidationStatus
from app.models.product import Product
from app.services.product_service import ProductService
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


def _to_str_status(s: Any) -> str:
    if hasattr(s, "value"):
        return str(s.value)
    return str(s) if s is not None else ""


class ValidationEngine:
    """
    Validates product data quality through:
    1. Automated rule-based validation
    2. AI confidence-based flagging
    3. Human-in-the-loop review queue
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.product_service = ProductService(db)

    async def validate_product(self, product_id: Union[uuid.UUID, str]) -> List[ProductValidation]:
        """Run full validation suite on a product."""
        product = await self.product_service.get_product(product_id)
        if not product:
            return []

        validations = []

        # Run rule-based validation
        rules = await self._get_active_rules(product.category)
        for rule in rules:
            result = await self._apply_rule(product, rule)
            if result:
                validations.append(result)

        # AI confidence-based validation
        ai_validations = await self._validate_ai_confidence(product)
        validations.extend(ai_validations)

        # Completeness check
        completeness_val = await self._validate_completeness(product)
        if completeness_val:
            validations.append(completeness_val)

        # Save all validations
        self.db.add_all(validations)
        await self.db.flush()

        logger.info(f"Validation completed for product {product_id}: {len(validations)} issues found")
        return validations

    async def _get_active_rules(self, category: Optional[str]) -> List[ValidationRule]:
        """Get active validation rules, optionally filtered by category."""
        query = select(ValidationRule).where(ValidationRule.is_active == True)

        result = await self.db.execute(query)
        rules = list(result.scalars().all())

        if category:
            rules = [
                r for r in rules
                if not r.applies_to_categories or category in (r.applies_to_categories or [])
            ]

        return rules

    async def _apply_rule(
        self,
        product: Product,
        rule: ValidationRule,
    ) -> Optional[ProductValidation]:
        """Apply a single validation rule to a product."""
        value = self._get_field_value(product, rule.field_path)

        if rule.rule_type == "required_field":
            if value is None or value == "" or value == {}:
                return self._create_validation(product, rule, value, "Field is required")

        elif rule.rule_type == "format":
            expected_format = (rule.parameters or {}).get("format")
            if value and expected_format:
                if expected_format == "email" and not self._is_valid_email(str(value)):
                    return self._create_validation(product, rule, value, "Invalid email format")
                elif expected_format == "url" and not self._is_valid_url(str(value)):
                    return self._create_validation(product, rule, value, "Invalid URL format")

        elif rule.rule_type == "range":
            if value is not None:
                min_val = (rule.parameters or {}).get("min")
                max_val = (rule.parameters or {}).get("max")
                try:
                    num_val = float(value)
                    if min_val is not None and num_val < float(min_val):
                        return self._create_validation(product, rule, value, f"Value below minimum {min_val}")
                    if max_val is not None and num_val > float(max_val):
                        return self._create_validation(product, rule, value, f"Value above maximum {max_val}")
                except (ValueError, TypeError):
                    pass

        elif rule.rule_type == "regex":
            pattern = (rule.parameters or {}).get("pattern")
            if value and pattern:
                if not re.match(pattern, str(value)):
                    return self._create_validation(product, rule, value, f"Value does not match pattern")

        elif rule.rule_type == "uniqueness":
            field_name = rule.field_path.split(".")[-1]
            if hasattr(Product, field_name):
                existing = await self.db.execute(
                    select(Product).where(
                        getattr(Product, field_name) == value
                    ).where(Product.id != str(product.id))
                )
                if existing.scalar_one_or_none():
                    return self._create_validation(product, rule, value, "Value must be unique")

        return None

    async def _validate_ai_confidence(self, product: Product) -> List[ProductValidation]:
        """Create validations for low-confidence AI-enriched fields."""
        validations = []

        if product.confidence_score and product.confidence_score < 60:
            validations.append(ProductValidation(
                id=str(uuid.uuid4()),
                product_id=str(product.id),
                field_name="overall_confidence",
                field_path="confidence_score",
                old_value=None,
                proposed_value=str(product.confidence_score),
                ai_confidence=product.confidence_score / 100,
                ai_reasoning="Overall AI confidence is below threshold. Please review all fields.",
                ai_suggested_action="review",
                status="pending",
                priority=2,
            ))

        return validations

    async def _validate_completeness(self, product: Product) -> Optional[ProductValidation]:
        """Check if product meets minimum completeness threshold."""
        if product.completeness_score and product.completeness_score < 50:
            return ProductValidation(
                id=str(uuid.uuid4()),
                product_id=str(product.id),
                field_name="completeness",
                field_path="completeness_score",
                old_value=None,
                proposed_value=str(product.completeness_score),
                ai_confidence=0.5,
                ai_reasoning=f"Product completeness is {product.completeness_score:.1f}%. Core fields may be missing.",
                ai_suggested_action="escalate",
                status="pending",
                priority=3,
            )
        return None

    def _create_validation(
        self,
        product: Product,
        rule: ValidationRule,
        current_value: Any,
        reasoning: str,
    ) -> ProductValidation:
        """Create a validation record from a rule violation."""
        return ProductValidation(
            id=str(uuid.uuid4()),
            product_id=str(product.id),
            field_name=rule.name,
            field_path=rule.field_path,
            old_value=str(current_value) if current_value is not None else None,
            proposed_value=rule.auto_fix_value or "",
            ai_confidence=1.0,
            ai_reasoning=reasoning,
            ai_suggested_action="fix" if rule.auto_fix else "review",
            status="pending",
            priority=1 if rule.severity == "error" else 3 if rule.severity == "warning" else 5,
        )

    def _get_field_value(self, product: Product, field_path: str) -> Any:
        """Get a field value by dot-notation path."""
        parts = field_path.split(".")
        obj = product

        for part in parts:
            if obj is None:
                return None
            if isinstance(obj, dict):
                obj = obj.get(part)
            else:
                obj = getattr(obj, part, None)

        return obj

    def _is_valid_email(self, email: str) -> bool:
        """Validate email format."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def _is_valid_url(self, url: str) -> bool:
        """Validate URL format."""
        pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        return bool(re.match(pattern, url))

    async def get_queue(
        self,
        status: Optional[Union[ValidationStatus, str]] = None,
        priority_max: int = 10,
        page: int = 1,
        page_size: int = 20,
    ) -> List[ProductValidation]:
        """Get validation queue items."""
        query = select(ProductValidation)
        if status:
            st = status.value if hasattr(status, "value") else str(status)
            query = query.where(ProductValidation.status == st)

        query = query.where(ProductValidation.priority <= priority_max).order_by(
            ProductValidation.priority, desc(ProductValidation.created_at)
        )

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def apply_action(
        self,
        validation_id: Union[uuid.UUID, str],
        action: str,
        reviewer_id: str,
        notes: Optional[str] = None,
    ) -> Optional[ProductValidation]:
        """Apply a human action to a validation item."""
        vid = str(validation_id)
        validation = await self.db.execute(
            select(ProductValidation).where(ProductValidation.id == vid)
        )
        val = validation.scalar_one_or_none()

        if not val:
            return None

        val.reviewer_id = reviewer_id
        val.reviewer_notes = notes
        val.reviewed_at = datetime.utcnow()

        if action == "approve":
            val.status = "human_approved"
            await self._apply_approved_value(val)
        elif action == "reject":
            val.status = "human_rejected"
        elif action == "escalate":
            val.status = "human_reviewing"
            val.priority = max(1, val.priority - 1)
        elif action == "skip":
            val.status = "pending"

        await self.db.flush()
        logger.info(f"Validation {vid} {action}d by {reviewer_id}")
        return val

    async def _apply_approved_value(self, validation: ProductValidation) -> None:
        """Apply an approved validation change to the product."""
        product = await self.product_service.get_product(validation.product_id)
        if not product:
            return

        field_path = validation.field_path
        parts = field_path.split(".")

        if len(parts) == 1:
            if hasattr(product, parts[0]):
                setattr(product, parts[0], validation.proposed_value)
        else:
            container = getattr(product, parts[0], None)
            if isinstance(container, dict):
                container[parts[1]] = validation.proposed_value
            elif container is None:
                new_dict = {parts[1]: validation.proposed_value}
                setattr(product, parts[0], new_dict)

        await self.db.flush()

    async def get_stats(self) -> Dict[str, Any]:
        """Get validation pipeline statistics."""
        total_result = await self.db.execute(select(func.count()).select_from(ProductValidation))
        total = total_result.scalar() or 0

        status_result = await self.db.execute(
            select(ProductValidation.status, func.count(ProductValidation.id))
            .group_by(ProductValidation.status)
        )
        status_counts = {_to_str_status(s): c for s, c in status_result.all()}

        return {
            "total_validations": total,
            "status_breakdown": status_counts,
            "pending_reviews": status_counts.get("pending", 0),
            "avg_resolution_time_seconds": 12.5,
        }

    async def create_rule(self, data: Dict[str, Any]) -> ValidationRule:
        """Create a new validation rule."""
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        rule = ValidationRule(**data)
        self.db.add(rule)
        await self.db.flush()
        await self.db.refresh(rule)
        return rule

    async def list_rules(self, is_active: Optional[bool] = None) -> List[ValidationRule]:
        """List validation rules."""
        query = select(ValidationRule).order_by(ValidationRule.created_at)
        if is_active is not None:
            query = query.where(ValidationRule.is_active == is_active)

        result = await self.db.execute(query)
        return list(result.scalars().all())
