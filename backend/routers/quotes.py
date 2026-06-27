"""
POST  /quotes          — generate a quote for a session via NVIDIA NIM (Llama 3.3)
PATCH /quotes/:id/react — record user reaction to a delivered quote
"""

import json
import uuid

from openai import AsyncOpenAI
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from config import settings
from database import AsyncSessionLocal, get_db
from models import Quote, QuoteDelivery, QuoteSource, Session
from prompt_builder import build_quote_prompt
from schemas import QuoteOut, QuoteRequest, ReactionUpdate

router = APIRouter(prefix="/quotes", tags=["quotes"])

_client = AsyncOpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=settings.nvidia_nim_api_key,
)


# ---------------------------------------------------------------------------
# Simple stateless quote — no session/DB required, used by the frontend
# ---------------------------------------------------------------------------

class SimpleQuoteRequest(BaseModel):
    primary: str
    secondary: str
    tertiary: str


class SimpleQuoteResponse(BaseModel):
    quote: str


@router.post("/generate", response_model=SimpleQuoteResponse)
async def generate_simple_quote(payload: SimpleQuoteRequest):
    """Generate a reflection for a given emotion triple without a DB session."""
    prompt = (
        f"You are a calm, grounding presence. "
        f"The person is feeling {payload.tertiary} "
        f"(which comes from {payload.secondary}, part of {payload.primary}). "
        f"Write one short, gentle reflection for this feeling — under 28 words. "
        f"Not advice, not a famous quote, not attributed to anyone. "
        f"Respond with ONLY the reflection text, nothing else."
    )
    try:
        completion = await _client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            top_p=0.9,
            max_tokens=80,
            stream=False,
        )
        quote = completion.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    return SimpleQuoteResponse(quote=quote)

# How many past sessions to pull for emotional arc context
HISTORY_WINDOW = 5


async def _fetch_session_with_emotions(session_id: uuid.UUID, db: AsyncSession) -> Session:
    result = await db.execute(
        select(Session)
        .where(Session.id == session_id)
        .options(selectinload(Session.emotion_logs))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def _fetch_past_sessions(user_id: uuid.UUID, exclude_id: uuid.UUID, db: AsyncSession) -> list[Session]:
    result = await db.execute(
        select(Session)
        .where(Session.user_id == user_id, Session.id != exclude_id)
        .options(selectinload(Session.emotion_logs))
        .order_by(Session.created_at.desc())
        .limit(HISTORY_WINDOW)
    )
    return result.scalars().all()


@router.post("", response_model=QuoteOut, status_code=201)
async def generate_quote(payload: QuoteRequest):
    # Read phase — release the connection before the slow LLM call so Neon
    # doesn't close an idle connection mid-request.
    async with AsyncSessionLocal() as db:
        current_session = await _fetch_session_with_emotions(payload.session_id, db)

        if not current_session.emotion_logs:
            raise HTTPException(
                status_code=422,
                detail="Session has no emotion logs — submit emotions before requesting a quote",
            )

        past_sessions = await _fetch_past_sessions(
            current_session.user_id, current_session.id, db
        )

        prompt = build_quote_prompt(current_session, past_sessions)
        session_id = current_session.id
        target_primary_emotions = [
            log.primary_emotion.value for log in current_session.emotion_logs
        ]

    # LLM call — no DB connection held open during this await
    try:
        completion = await _client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            top_p=0.7,
            max_tokens=1024,
            stream=False,
        )
        raw = completion.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="LLM returned malformed JSON")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    # Write phase — fresh connection for persisting quote + delivery
    async with AsyncSessionLocal() as db:
        quote = Quote(
            id=uuid.uuid4(),
            content=data["content"],
            author=data.get("author"),
            source=QuoteSource.generated,
            tags=data.get("tags", []),
            target_primary_emotions=target_primary_emotions,
        )
        db.add(quote)
        await db.flush()

        delivery = QuoteDelivery(
            id=uuid.uuid4(),
            session_id=session_id,
            quote_id=quote.id,
            prompt_snapshot=prompt,
            was_skipped=False,
        )
        db.add(delivery)
        await db.commit()

        return QuoteOut(
            id=quote.id,
            content=quote.content,
            author=quote.author,
            tags=quote.tags,
            delivery_id=delivery.id,
        )


@router.patch("/{delivery_id}/react", status_code=200)
async def react_to_quote(
    delivery_id: uuid.UUID,
    payload: ReactionUpdate,
    db: AsyncSession = Depends(get_db),
):
    delivery = await db.get(QuoteDelivery, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    delivery.reaction = payload.reaction
    if payload.reaction == "missed":
        delivery.was_skipped = True

    await db.flush()
    return {"delivery_id": delivery_id, "reaction": payload.reaction}