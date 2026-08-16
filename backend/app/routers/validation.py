"""Validation router - human-in-the-loop validation queue."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.validation_engine import ValidationEngine

router = APIRouter()


# ============ Schemas ============

class ValidationAction(BaseModel):
    action: str = Field(..., pattern="^(approve|reject|escalate|skip)$")
    reviewer_id: str = Field(default="demo-user", min_length=1)
    notes: Optional[str] = Field(default=None)


class ValidationResponse(BaseModel):
    id: str
    product_id: str
    field_name: str
    field_path: str
    old_value: Optional[str] = None
    proposed_value: str
    ai_confidence: float
    ai_reasoning: Optional[str] = None
    status: str
    priority: int
    created_at: Optional[str] = None


class ValidationRuleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    rule_type: str = Field(..., pattern="^(required_field|format|range|regex|cross_field|uniqueness)$")
    field_path: str = Field(..., min_length=1)
    parameters: dict = Field(default_factory=dict)
    severity: str = Field(default="error", pattern="^(error|warning|info)$")
    auto_fix: bool = Field(default=False)
    applies_to_categories: List[str] = Field(default_factory=list)


def _to_str_status(s: any) -> str:
    if hasattr(s, "value"):
        return str(s.value)
    return str(s) if s is not None else ""


# ============ Routes ============

@router.get(
    "/queue",
    summary="Get validation queue items",
)
async def get_validation_queue(
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query("pending"),
    priority_max: int = Query(10, ge=1, le=10),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get items in the human validation queue."""
    engine = ValidationEngine(db)
    items = await engine.get_queue(
        status=status,
        priority_max=priority_max,
        page=page,
        page_size=page_size,
    )
    return {
        "items": [
            {
                "id": str(v.id),
                "product_id": str(v.product_id),
                "field_name": v.field_name,
                "field_path": v.field_path,
                "old_value": v.old_value,
                "proposed_value": v.proposed_value,
                "ai_confidence": v.ai_confidence,
                "ai_reasoning": v.ai_reasoning,
                "status": _to_str_status(v.status),
                "priority": v.priority,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in items
        ],
        "page": page,
        "page_size": page_size,
    }


@router.post(
    "/{validation_id}/action",
    summary="Act on a validation item",
)
async def act_on_validation(
    validation_id: str,
    action: ValidationAction,
    db: AsyncSession = Depends(get_db),
):
    """
    Approve, reject, escalate, or skip a validation item.
    """
    engine = ValidationEngine(db)
    result = await engine.apply_action(
        validation_id=validation_id,
        action=action.action,
        reviewer_id=action.reviewer_id,
        notes=action.notes,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Validation item not found")
    return {
        "message": f"Validation {action.action}d",
        "validation_id": validation_id,
        "new_status": _to_str_status(result.status),
    }


@router.get(
    "/stats",
    summary="Get validation statistics",
)
async def get_validation_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregate statistics about the validation pipeline."""
    engine = ValidationEngine(db)
    stats = await engine.get_stats()
    return stats


@router.post(
    "/rules",
    summary="Create a validation rule",
)
async def create_validation_rule(
    rule: ValidationRuleCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new automated validation rule."""
    engine = ValidationEngine(db)
    new_rule = await engine.create_rule(rule.model_dump())
    return {
        "id": str(new_rule.id),
        "name": new_rule.name,
        "rule_type": new_rule.rule_type,
        "field_path": new_rule.field_path,
        "is_active": new_rule.is_active,
    }


@router.get(
    "/rules",
    summary="List validation rules",
)
async def list_validation_rules(
    db: AsyncSession = Depends(get_db),
    is_active: Optional[bool] = Query(None),
):
    """List all configured validation rules."""
    engine = ValidationEngine(db)
    rules = await engine.list_rules(is_active=is_active)
    return {
        "rules": [
            {
                "id": str(r.id),
                "name": r.name,
                "description": r.description,
                "rule_type": r.rule_type,
                "field_path": r.field_path,
                "severity": r.severity,
                "auto_fix": r.auto_fix,
                "is_active": r.is_active,
            }
            for r in rules
        ]
    }
