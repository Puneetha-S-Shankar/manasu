"""
Insights router for clients.
Provides mood trends and AI-generated summaries.
"""

import json
import logging
import time
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth.internal import require_client
from config import settings
from database import get_db
from models import EmotionLog, Session, User
from schemas import AISummaryOut, DayMoodPoint

logger = logging.getLogger("manasu")

router = APIRouter(prefix="/insights", tags=["insights"])

_client = AsyncOpenAI(
    base_url=settings.nvidia_nim_base_url,
    api_key=settings.nvidia_nim_api_key,
    timeout=15.0,
)

TREND_DAYS = 14
SUMMARY_DAYS = 7


@router.get("/trends", response_model=list[DayMoodPoint])
async def get_mood_trends(
    current_user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Returns the dominant mood and average intensity per day for the last 14 days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=TREND_DAYS)

    result = await db.execute(
        select(Session)
        .where(Session.user_id == current_user.id, Session.created_at >= cutoff)
        .options(selectinload(Session.emotion_logs))
        .order_by(Session.created_at.desc())
    )
    sessions = result.scalars().all()

    by_day: dict[str, list[EmotionLog]] = {}
    for s in sessions:
        day = s.created_at.date().isoformat()
        by_day.setdefault(day, []).extend(s.emotion_logs)

    trend: list[DayMoodPoint] = []
    # Ensure we include days that might have no data if we want a full calendar,
    # but returning just the days with data is fine for now (the UI can pad it).
    for day in sorted(by_day.keys()):
        logs = by_day[day]
        primaries = [log.primary_emotion.value for log in logs]
        dominant = Counter(primaries).most_common(1)[0][0] if primaries else None

        intensities = [log.intensity for log in logs if log.intensity is not None]
        avg_intensity = (sum(intensities) / len(intensities)) if intensities else None

        trend.append(
            DayMoodPoint(
                date=day,
                primary_emotion=dominant,
                avg_intensity=avg_intensity,
            )
        )

    return trend


@router.get("/summary", response_model=AISummaryOut)
async def get_ai_summary(
    current_user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Generates a supportive AI summary of the client's last 7 days."""
    t0 = time.perf_counter()
    cutoff = datetime.now(timezone.utc) - timedelta(days=SUMMARY_DAYS)

    result = await db.execute(
        select(Session)
        .where(Session.user_id == current_user.id, Session.created_at >= cutoff)
        .options(selectinload(Session.emotion_logs))
        .order_by(Session.created_at.asc())
    )
    sessions = list(result.scalars().all())

    if not sessions:
        raise HTTPException(
            status_code=400,
            detail="Not enough check-ins in the last 7 days to generate a summary."
        )

    # Build the prompt context
    log_text = ""
    for s in sessions:
        day_str = s.created_at.strftime("%A, %b %d")
        emotions = []
        for e in s.emotion_logs:
            em_str = f"{e.tertiary_emotion.value if e.tertiary_emotion else e.secondary_emotion.value} (intensity {e.intensity}/5)"
            emotions.append(em_str)
        emotions_str = ", ".join(emotions)
        notes = f" Notes: {s.notes}" if s.notes else ""
        log_text += f"[{day_str}] Emotions: {emotions_str}.{notes}\n"

    prompt = (
        "You are an empathetic, insightful psychological assistant. "
        "Below are the emotion logs of a user over the past 7 days.\n\n"
        f"Logs:\n{log_text}\n\n"
        "Please provide:\n"
        "1. A gentle, supportive 'summary' paragraph (around 3-4 sentences) reflecting on their emotional journey this week, acknowledging any struggles and highlighting resilience.\n"
        "2. A short list of 'triggers' (2-3 items) that might be influencing their negative emotions, based strictly on their notes (if any), or simply noting recurring difficult emotions.\n\n"
        "Return ONLY a valid JSON object with the following schema:\n"
        "{\n"
        '  "summary": "your paragraph here",\n'
        '  "triggers": ["trigger 1", "trigger 2"]\n'
        "}\n"
    )

    t_db = time.perf_counter()

    try:
        completion = await _client.chat.completions.create(
            model="mistralai/mixtral-8x7b-instruct-v0.1",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            top_p=0.8,
            max_tokens=250,
            stream=False,
        )
        content = completion.choices[0].message.content
        if not content:
            raise ValueError("LLM returned empty or null content")

        raw = content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
        
        summary = data.get("summary", "We couldn't generate a full summary this time.")
        triggers = data.get("triggers", [])
        
    except json.JSONDecodeError:
        logger.error(f"insights summary | LLM returned malformed JSON: {raw}")
        raise HTTPException(status_code=502, detail="LLM returned malformed JSON")
    except Exception as e:
        logger.error(f"insights summary | LLM error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    t_end = time.perf_counter()
    logger.info(f"insights summary | db: {(t_db - t0)*1000:.0f}ms, llm: {(t_end - t_db)*1000:.0f}ms")

    return AISummaryOut(
        summary=summary,
        triggers=triggers,
        generated_at=datetime.now(timezone.utc)
    )
