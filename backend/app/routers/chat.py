"""Chat router for BrahMos AI Conversational Assistant."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.chat_service import ChatService

router = APIRouter()


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: List[Dict[str, str]] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    model: str
    suggested_actions: List[str] = Field(default_factory=list)


@router.post(
    "",
    response_model=ChatResponse,
    summary="Chat with BrahMos AI Assistant",
)
async def chat_with_brahmos(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Conversational endpoint powered by BrahMos AI.
    Answers technical engineering queries, guides platform workflows,
    and references live catalog data.
    """
    service = ChatService(db)
    result = await service.chat(request.message, request.history)
    return ChatResponse(
        reply=result["reply"],
        model=result["model"],
        suggested_actions=result.get("suggested_actions", []),
    )


@router.get(
    "/suggestions",
    summary="Get sample starter questions for BrahMos AI",
)
async def get_chat_suggestions():
    """Returns recommended starter questions for user exploration."""
    return {
        "suggestions": [
            "Who created and developed BrahMos AI?",
            "How does the CatalogIQ workflow work from upload to search?",
            "What technical parameters are needed for angular contact ball bearings?",
            "How does the HITL Validation Queue work?",
            "Find high-pressure hydraulic solenoid valves (350 bar)",
            "What is the difference between IE2 and IE3 induction motors?",
        ]
    }
