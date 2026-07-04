from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, contains_eager

from auth.internal import require_client
from database import get_db
from models import Session, User, QuoteDelivery, Quote, Reaction
from schemas import SessionOut
from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/client", tags=["client"])

class SavedQuoteOut(BaseModel):
    id: uuid.UUID
    content: str
    author: Optional[str]
    tags: list[str]
    saved_at: datetime

    model_config = {"from_attributes": True}

@router.get("/history", response_model=list[SessionOut])
async def get_history(
    current_user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Session)
        .where(Session.user_id == current_user.id)
        .options(selectinload(Session.emotion_logs))
        .order_by(Session.created_at.desc())
        .limit(30)
    )
    return list(result.scalars().all())

@router.get("/saved-quotes", response_model=list[SavedQuoteOut])
async def get_saved_quotes(
    current_user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(QuoteDelivery)
        .join(QuoteDelivery.session)
        .join(QuoteDelivery.quote)
        .where(
            Session.user_id == current_user.id,
            QuoteDelivery.reaction == Reaction.saved
        )
        .options(contains_eager(QuoteDelivery.quote))
        .order_by(QuoteDelivery.created_at.desc())
    )
    deliveries = result.scalars().all()
    
    out = []
    for d in deliveries:
        if d.quote:
            out.append(SavedQuoteOut(
                id=d.quote.id,
                content=d.quote.content,
                author=d.quote.author,
                tags=d.quote.tags,
                saved_at=d.created_at
            ))
    return out

