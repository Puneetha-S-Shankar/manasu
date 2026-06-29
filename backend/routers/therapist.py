"""
Therapist layer router.

Endpoints for therapists to manage clients, curate quote packs, push
quotes/exercises, and monitor mood alerts.

NOTE (auth): Authentication is currently a simple `X-Therapist-ID: <uuid>`
header that must match the therapist_id in the path. This is a placeholder.
TODO: Replace header-based auth with proper JWT/session auth before production.
"""

import uuid
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import (
    EmotionLog,
    MoodAlert,
    Quote,
    QuotePack,
    QuotePackItem,
    Session,
    Therapist,
    TherapistClient,
    TherapistPush,
    User,
)
from schemas import (
    ClientLinkCreate,
    ClientLinkOut,
    ClientMoodSummary,
    DayMoodPoint,
    MoodAlertOut,
    QuotePackCreate,
    QuotePackItemAdd,
    QuotePackOut,
    TherapistCreate,
    TherapistOut,
    TherapistPushCreate,
    TherapistPushOut,
)

router = APIRouter(prefix="/therapist", tags=["therapist"])

# Primary emotions considered "low mood" for streak / alert logic
LOW_MOOD_PRIMARIES = {"Sad", "Afraid", "Angry", "Bad"}
TREND_DAYS = 14


# ---------------------------------------------------------------------------
# Auth (placeholder)
# ---------------------------------------------------------------------------

from auth.internal import require_therapist as check_therapist_role

async def get_therapist_profile(
    current_user: User = Depends(check_therapist_role),
    db: AsyncSession = Depends(get_db),
) -> Therapist:
    """
    Resolve the therapist profile for the authenticated user.
    """
    result = await db.execute(
        select(Therapist).where(Therapist.user_id == current_user.id)
    )
    therapist = result.scalar_one_or_none()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist profile not found")
    return therapist


def _verify_access(path_therapist_id: uuid.UUID, caller: Therapist) -> None:
    """Ensure the authenticated therapist matches the therapist_id in the path."""
    if path_therapist_id != caller.id:
        raise HTTPException(status_code=403, detail="Cannot access another therapist's data")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _require_active_link(
    therapist_id: uuid.UUID, client_id: uuid.UUID, db: AsyncSession
) -> TherapistClient:
    result = await db.execute(
        select(TherapistClient).where(
            TherapistClient.therapist_id == therapist_id,
            TherapistClient.client_id == client_id,
        )
    )
    link = result.scalar_one_or_none()
    if not link or not link.is_active:
        raise HTTPException(status_code=404, detail="Client not linked to this therapist")
    return link


async def _pack_to_out(pack: QuotePack, db: AsyncSession) -> QuotePackOut:
    count = await db.scalar(
        select(func.count(QuotePackItem.id)).where(QuotePackItem.pack_id == pack.id)
    )
    return QuotePackOut(
        id=pack.id,
        name=pack.name,
        description=pack.description,
        tags=pack.tags or [],
        quote_count=count or 0,
        created_at=pack.created_at,
    )


# ---------------------------------------------------------------------------
# Therapist auth / creation
# ---------------------------------------------------------------------------

@router.post("/profile", response_model=TherapistOut, status_code=201)
async def create_therapist_profile(
    payload: TherapistCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_therapist_role)
):
    # Ensure they can only create a profile for themselves
    if payload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot create profile for another user")

    existing = await db.execute(
        select(Therapist).where(Therapist.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Therapist profile already exists")

    therapist = Therapist(
        id=uuid.uuid4(),
        user_id=current_user.id,
        license_number=payload.license_number,
        bio=payload.bio,
    )
    db.add(therapist)
    await db.commit()
    await db.refresh(therapist)
    
    # We need to load the user relationship to satisfy TherapistOut (which flattens email/name)
    result = await db.execute(
        select(Therapist)
        .where(Therapist.id == therapist.id)
        .options(selectinload(Therapist.user))
    )
    return result.scalar_one()


# ---------------------------------------------------------------------------
# Client linking
# ---------------------------------------------------------------------------

@router.post("/clients", response_model=ClientLinkOut, status_code=201)
async def link_client(
    payload: ClientLinkCreate,
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):

    # Resolve client by email
    result = await db.execute(select(User).where(User.email == payload.client_email))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="No user found with that email")

    # Re-activate an existing link if present, else create a new one
    existing = await db.execute(
        select(TherapistClient).where(
            TherapistClient.therapist_id == caller.id,
            TherapistClient.client_id == client.id,
        )
    )
    link = existing.scalar_one_or_none()
    if link:
        if link.is_active:
            raise HTTPException(status_code=409, detail="Client already linked")
        link.is_active = True
    else:
        link = TherapistClient(
            id=uuid.uuid4(),
            therapist_id=caller.id,
            client_id=client.id,
            is_active=True,
        )
        db.add(link)

    await db.commit()
    await db.refresh(link)

    return ClientLinkOut(
        id=link.id,
        therapist_id=link.therapist_id,
        client_id=link.client_id,
        client_name=client.name,
        client_email=client.email,
        is_active=link.is_active,
        linked_at=link.linked_at,
    )


@router.delete("/clients/{client_id}", status_code=200)
async def unlink_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    link = await _require_active_link(caller.id, client_id, db)
    link.is_active = False
    await db.commit()
    return {"client_id": client_id, "is_active": False}


@router.get("/clients", response_model=list[ClientLinkOut])
async def list_clients(
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    result = await db.execute(
        select(TherapistClient)
        .where(
            TherapistClient.therapist_id == caller.id,
            TherapistClient.is_active.is_(True),
        )
        .options(selectinload(TherapistClient.client))
        .order_by(TherapistClient.linked_at.desc())
    )
    links = result.scalars().all()

    return [
        ClientLinkOut(
            id=link.id,
            therapist_id=link.therapist_id,
            client_id=link.client_id,
            client_name=link.client.name if link.client else None,
            client_email=link.client.email if link.client else "",
            is_active=link.is_active,
            linked_at=link.linked_at,
        )
        for link in links
    ]


# ---------------------------------------------------------------------------
# Client mood summary (Story 2)
# ---------------------------------------------------------------------------

@router.get("/clients/{client_id}/summary", response_model=ClientMoodSummary)
async def client_mood_summary(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    link = await _require_active_link(caller.id, client_id, db)

    client = await db.get(User, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    total = await db.scalar(
        select(func.count(Session.id)).where(Session.user_id == client_id)
    )
    total_checkins = total or 0

    cutoff = datetime.now(timezone.utc) - timedelta(days=TREND_DAYS)

    # Last 14 days of sessions + their emotion logs, newest first
    result = await db.execute(
        select(Session)
        .where(Session.user_id == client_id, Session.created_at >= cutoff)
        .options(selectinload(Session.emotion_logs))
        .order_by(Session.created_at.desc())
    )
    sessions = result.scalars().all()

    # ---- last_checkin ----
    last_checkin = sessions[0].created_at if sessions else None

    # ---- most_frequent_primary (count across all logs in window) ----
    all_primaries = [
        log.primary_emotion.value
        for s in sessions
        for log in s.emotion_logs
    ]
    most_frequent_primary = (
        Counter(all_primaries).most_common(1)[0][0] if all_primaries else None
    )

    # ---- low_mood_streak: consecutive most-recent sessions whose dominant
    #      primary emotion is a low-mood one ----
    low_mood_streak = 0
    for s in sessions:  # already newest-first
        primaries = [log.primary_emotion.value for log in s.emotion_logs]
        if not primaries:
            break
        dominant = Counter(primaries).most_common(1)[0][0]
        if dominant in LOW_MOOD_PRIMARIES:
            low_mood_streak += 1
        else:
            break

    # ---- has_unread_alert ----
    unread = await db.scalar(
        select(func.count(MoodAlert.id)).where(
            MoodAlert.client_id == client_id,
            MoodAlert.is_read.is_(False),
        )
    )
    has_unread_alert = bool(unread)

    # ---- fourteen_day_trend: per-day dominant primary + avg intensity ----
    by_day: dict[str, list[EmotionLog]] = {}
    for s in sessions:
        day = s.created_at.date().isoformat()
        by_day.setdefault(day, []).extend(s.emotion_logs)

    trend: list[DayMoodPoint] = []
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

    low_mood_days = sum(
        1 for pt in trend if pt.primary_emotion in LOW_MOOD_PRIMARIES
    )

    return ClientMoodSummary(
        client_id=client.id,
        client_name=client.name,
        client_email=client.email,
        linked_since=link.linked_at,
        total_checkins=total_checkins,
        last_checkin=last_checkin,
        most_frequent_primary=most_frequent_primary,
        low_mood_streak=low_mood_streak,
        low_mood_days=low_mood_days,
        has_unread_alert=has_unread_alert,
        fourteen_day_trend=trend,
        recent_sessions=sessions,
    )


# ---------------------------------------------------------------------------
# Quote packs (Story 4)
# ---------------------------------------------------------------------------

@router.post("/packs", response_model=QuotePackOut, status_code=201)
async def create_pack(
    payload: QuotePackCreate,
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    pack = QuotePack(
        id=uuid.uuid4(),
        therapist_id=caller.id,
        name=payload.name,
        description=payload.description,
        tags=payload.tags,
    )
    db.add(pack)
    await db.commit()
    await db.refresh(pack)
    return await _pack_to_out(pack, db)


@router.get("/packs/{pack_id}", response_model=QuotePackOut)
async def get_pack(
    pack_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    pack = await db.get(QuotePack, pack_id)
    if not pack or pack.therapist_id != caller.id:
        raise HTTPException(status_code=404, detail="Pack not found")
    return await _pack_to_out(pack, db)


@router.post("/packs/{pack_id}/quotes", response_model=QuotePackOut, status_code=201)
async def add_quote_to_pack(
    pack_id: uuid.UUID,
    payload: QuotePackItemAdd,
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    pack = await db.get(QuotePack, pack_id)
    if not pack or pack.therapist_id != caller.id:
        raise HTTPException(status_code=404, detail="Pack not found")

    if payload.quote_id:
        quote = await db.get(Quote, payload.quote_id)
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        qid = quote.id
    elif payload.content:
        # Create a new quote
        qid = uuid.uuid4()
        new_quote = Quote(
            id=qid,
            content=payload.content,
            author=payload.author,
            tags=payload.tags,
            is_global=False,
            therapist_id=caller.id
        )
        db.add(new_quote)
    else:
        raise HTTPException(status_code=400, detail="Must provide quote_id or content")

    item = QuotePackItem(
        id=uuid.uuid4(),
        pack_id=pack_id,
        quote_id=qid,
        order=payload.order,
    )
    db.add(item)
    await db.commit()
    await db.refresh(pack)
    return await _pack_to_out(pack, db)


@router.delete("/packs/{pack_id}/quotes/{quote_id}", response_model=QuotePackOut)
async def remove_quote_from_pack(
    pack_id: uuid.UUID,
    quote_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    pack = await db.get(QuotePack, pack_id)
    if not pack or pack.therapist_id != caller.id:
        raise HTTPException(status_code=404, detail="Pack not found")

    result = await db.execute(
        select(QuotePackItem).where(
            QuotePackItem.pack_id == pack_id,
            QuotePackItem.quote_id == quote_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Quote not found in pack")

    await db.delete(item)
    await db.commit()
    await db.refresh(pack)
    return await _pack_to_out(pack, db)


@router.get("/packs/{pack_id}/quotes")
async def list_pack_quotes(
    pack_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    pack = await db.get(QuotePack, pack_id)
    if not pack or pack.therapist_id != caller.id:
        raise HTTPException(status_code=404, detail="Pack not found")

    result = await db.execute(
        select(QuotePackItem)
        .where(QuotePackItem.pack_id == pack_id)
        .options(selectinload(QuotePackItem.quote))
        .order_by(QuotePackItem.order.asc(), QuotePackItem.created_at.asc())
    )
    items = result.scalars().all()

    return [
        {
            "id": item.quote.id,
            "content": item.quote.content,
            "tags": item.quote.tags or [],
            "author": item.quote.author,
            "order": item.order
        }
        for item in items if item.quote
    ]


@router.get("/packs", response_model=list[QuotePackOut])
async def list_packs(
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    result = await db.execute(
        select(QuotePack)
        .where(QuotePack.therapist_id == caller.id)
        .order_by(QuotePack.created_at.desc())
    )
    packs = result.scalars().all()
    return [await _pack_to_out(pack, db) for pack in packs]


# ---------------------------------------------------------------------------
# Therapist push (Story 3)
# ---------------------------------------------------------------------------

@router.post("/push", response_model=TherapistPushOut, status_code=201)
async def push_to_client(
    payload: TherapistPushCreate,
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    await _require_active_link(caller.id, payload.client_id, db)

    push = TherapistPush(
        id=uuid.uuid4(),
        therapist_id=caller.id,
        client_id=payload.client_id,
        quote_id=payload.quote_id,
        pack_id=payload.pack_id,
        content=payload.content,
        push_type=payload.push_type,
    )
    db.add(push)
    await db.commit()
    await db.refresh(push)

    client = await db.get(User, payload.client_id)

    return TherapistPushOut(
        id=push.id,
        client_id=push.client_id,
        client_name=client.name if client else None,
        push_type=push.push_type.value,
        content=push.content,
        sent_at=push.sent_at,
        seen_at=push.seen_at,
        reaction=push.reaction.value if push.reaction else None,
    )


# ---------------------------------------------------------------------------
# Mood alerts (Story 5)
# ---------------------------------------------------------------------------

@router.get("/alerts", response_model=list[MoodAlertOut])
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    result = await db.execute(
        select(MoodAlert)
        .where(MoodAlert.therapist_id == caller.id)
        .options(selectinload(MoodAlert.client))
        .order_by(MoodAlert.triggered_at.desc())
    )
    alerts = result.scalars().all()

    return [
        MoodAlertOut(
            id=alert.id,
            client_id=alert.client_id,
            client_name=alert.client.name if alert.client else None,
            alert_type=alert.alert_type.value,
            reason=alert.reason,
            is_read=alert.is_read,
            triggered_at=alert.triggered_at,
        )
        for alert in alerts
    ]


@router.patch("/alerts/{alert_id}/read", status_code=200)
async def mark_alert_read(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    caller: Therapist = Depends(get_therapist_profile),
):
    alert = await db.get(MoodAlert, alert_id)
    if not alert or alert.therapist_id != caller.id:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    await db.commit()
    return {"alert_id": alert_id, "is_read": True}
