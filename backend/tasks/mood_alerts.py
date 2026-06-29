"""
Scheduled job: scan every active therapist↔client pair and raise MoodAlerts.

Three rules are evaluated per pair:
  1. low_mood_streak — ≥5 of the client's last 7 sessions logged a negative emotion
  2. high_intensity  — any emotion log in the last 48h with intensity ≥ 5
  3. no_checkin      — no session created in the last 3 days

Each rule is deduplicated: a fresh alert of the same type is only inserted if
no unread alert of that type already exists for the client within the last 24h.
"""

import logging
import uuid
from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import (
    AlertType,
    EmotionLog,
    MoodAlert,
    PrimaryEmotion,
    Session,
    TherapistClient,
)

logger = logging.getLogger("manasu")

# Emotions that count toward a "low mood" session.
LOW_MOOD_EMOTIONS = {
    PrimaryEmotion.Sad,
    PrimaryEmotion.Afraid,
    PrimaryEmotion.Angry,
    PrimaryEmotion.Bad,
}

LOW_MOOD_WINDOW = 7          # number of recent sessions to inspect
LOW_MOOD_THRESHOLD = 5       # how many must be negative to fire
HIGH_INTENSITY_HOURS = 48
HIGH_INTENSITY_THRESHOLD = 5
NO_CHECKIN_DAYS = 3
DEDUP_HOURS = 24


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _alert_exists_recently(
    db: AsyncSession,
    client_id: uuid.UUID,
    alert_type: AlertType,
) -> bool:
    """True if an unread alert of this type fired for the client in the dedup window."""
    cutoff = _now() - timedelta(hours=DEDUP_HOURS)
    result = await db.execute(
        select(MoodAlert.id).where(
            MoodAlert.client_id == client_id,
            MoodAlert.alert_type == alert_type,
            MoodAlert.is_read.is_(False),
            MoodAlert.triggered_at > cutoff,
        ).limit(1)
    )
    return result.scalar_one_or_none() is not None


def _add_alert(
    db: AsyncSession,
    therapist_id: uuid.UUID,
    client_id: uuid.UUID,
    alert_type: AlertType,
    reason: str,
) -> None:
    db.add(
        MoodAlert(
            id=uuid.uuid4(),
            therapist_id=therapist_id,
            client_id=client_id,
            alert_type=alert_type,
            reason=reason,
            is_read=False,
            triggered_at=_now(),
        )
    )
    logger.info(
        "mood_alerts | raised %s for client=%s — %s",
        alert_type.value,
        client_id,
        reason,
    )


async def _check_low_mood_streak(
    db: AsyncSession,
    therapist_id: uuid.UUID,
    client_id: uuid.UUID,
) -> None:
    result = await db.execute(
        select(Session)
        .where(Session.user_id == client_id)
        .options(selectinload(Session.emotion_logs))
        .order_by(Session.created_at.desc())
        .limit(LOW_MOOD_WINDOW)
    )
    sessions = result.scalars().all()

    # Collapse each session to a single primary emotion (its first log).
    primaries: list[PrimaryEmotion] = []
    for session in sessions:
        if session.emotion_logs:
            primaries.append(session.emotion_logs[0].primary_emotion)

    low_count = sum(1 for p in primaries if p in LOW_MOOD_EMOTIONS)
    if low_count < LOW_MOOD_THRESHOLD:
        return

    if await _alert_exists_recently(db, client_id, AlertType.low_mood_streak):
        return

    emotion_counts = dict(
        Counter(p.value for p in primaries if p in LOW_MOOD_EMOTIONS)
    )
    reason = f"{low_count}/7 recent sessions logged: {emotion_counts}"
    _add_alert(db, therapist_id, client_id, AlertType.low_mood_streak, reason)


async def _check_high_intensity(
    db: AsyncSession,
    therapist_id: uuid.UUID,
    client_id: uuid.UUID,
) -> None:
    cutoff = _now() - timedelta(hours=HIGH_INTENSITY_HOURS)
    result = await db.execute(
        select(func.max(EmotionLog.intensity))
        .join(Session, EmotionLog.session_id == Session.id)
        .where(
            Session.user_id == client_id,
            EmotionLog.created_at > cutoff,
        )
    )
    max_intensity = result.scalar_one_or_none()

    if max_intensity is None or max_intensity < HIGH_INTENSITY_THRESHOLD:
        return

    if await _alert_exists_recently(db, client_id, AlertType.high_intensity):
        return

    reason = (
        f"Intensity {max_intensity}/5 logged in the last "
        f"{HIGH_INTENSITY_HOURS}h"
    )
    _add_alert(db, therapist_id, client_id, AlertType.high_intensity, reason)


async def _check_no_checkin(
    db: AsyncSession,
    therapist_id: uuid.UUID,
    client_id: uuid.UUID,
) -> None:
    result = await db.execute(
        select(func.max(Session.created_at)).where(Session.user_id == client_id)
    )
    last_checkin = result.scalar_one_or_none()

    # No sessions ever, or the most recent one is older than the threshold.
    cutoff = _now() - timedelta(days=NO_CHECKIN_DAYS)
    if last_checkin is not None and last_checkin > cutoff:
        return

    if await _alert_exists_recently(db, client_id, AlertType.no_checkin):
        return

    if last_checkin is None:
        reason = "No check-ins recorded yet"
    else:
        days = (_now() - last_checkin).days
        reason = f"No check-in for {days} days (last: {last_checkin.date()})"
    _add_alert(db, therapist_id, client_id, AlertType.no_checkin, reason)


async def check_mood_alerts(db: AsyncSession) -> None:
    """Evaluate all alert rules for every active therapist↔client pair."""
    logger.info("mood_alerts | scan starting")

    result = await db.execute(
        select(TherapistClient).where(TherapistClient.is_active.is_(True))
    )
    pairs = result.scalars().all()

    for pair in pairs:
        await _check_low_mood_streak(db, pair.therapist_id, pair.client_id)
        await _check_high_intensity(db, pair.therapist_id, pair.client_id)
        await _check_no_checkin(db, pair.therapist_id, pair.client_id)

    await db.commit()
    logger.info("mood_alerts | scan complete — %d active pairs evaluated", len(pairs))
