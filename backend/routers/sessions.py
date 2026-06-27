"""
POST /sessions
Creates a session and logs all emotions submitted from the wheel in one transaction.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import EmotionLog, Session, TimeOfDay, User
from schemas import SessionCreate, SessionOut

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _derive_time_of_day() -> TimeOfDay:
    hour = datetime.now(timezone.utc).hour
    if 5 <= hour < 12:
        return TimeOfDay.morning
    elif 12 <= hour < 17:
        return TimeOfDay.afternoon
    elif 17 <= hour < 21:
        return TimeOfDay.evening
    else:
        return TimeOfDay.night


@router.post("", response_model=SessionOut, status_code=201)
async def create_session(payload: SessionCreate, db: AsyncSession = Depends(get_db)):
    # Verify the user exists
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not payload.emotions:
        raise HTTPException(status_code=422, detail="At least one emotion is required")

    # Derive time of day if not provided
    time_of_day = payload.time_of_day or _derive_time_of_day()

    # Create session
    session = Session(
        id=uuid.uuid4(),
        user_id=payload.user_id,
        time_of_day=time_of_day,
        notes=payload.notes,
    )
    db.add(session)
    await db.flush()  # get session.id before creating emotion logs

    # Create all emotion logs in bulk
    emotion_logs = [
        EmotionLog(
            id=uuid.uuid4(),
            session_id=session.id,
            primary_emotion=e.primary_emotion,
            secondary_emotion=e.secondary_emotion,
            tertiary_emotion=e.tertiary_emotion,
            intensity=e.intensity,
        )
        for e in payload.emotions
    ]
    db.add_all(emotion_logs)
    await db.flush()

    # Reload with relationships for the response
    result = await db.execute(
        select(Session)
        .where(Session.id == session.id)
        .options(selectinload(Session.emotion_logs))
    )
    session_with_logs = result.scalar_one()

    return session_with_logs
