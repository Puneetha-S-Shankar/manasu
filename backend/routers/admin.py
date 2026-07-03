from typing import List, Optional
from datetime import datetime, timedelta, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, cast, Date
from pydantic import BaseModel

from database import get_db
from models import (
    User, UserRole, LinkRequest, TherapistClient, Quote,
    QuotePack, Therapist, QuotePackItem, Session, PrimaryEmotion, EmotionLog
)
from schemas import UserOut, LinkRequestOut, LinkRequestCreate, QuoteOut
from auth.internal import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

class RoleUpdate(BaseModel):
    role: UserRole

class LinkRequestAdminCreate(BaseModel):
    therapist_id: uuid.UUID
    client_email: str

class QuoteAdminOut(BaseModel):
    id: uuid.UUID
    content: str
    pack_name: Optional[str]
    tags: list[str]
    therapist_name: Optional[str]
    flagged: bool

class DayMoodPoint(BaseModel):
    date: str
    count: int

class MetricsOut(BaseModel):
    total_users: int
    total_checkins: int
    checkins_last_7d: int
    checkins_last_30d: int
    emotion_distribution: dict[str, int]
    avg_intensity_overall: float
    low_mood_streak_count: int
    daily_checkins_last_30d: List[DayMoodPoint]


@router.get("/users", response_model=List[UserOut])
async def get_users(
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(or_(User.name.ilike(search_pattern), User.email.ilike(search_pattern)))
    
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/users/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: uuid.UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = payload.role
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}/deactivate", response_model=UserOut)
async def deactivate_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}/reactivate", response_model=UserOut)
async def reactivate_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/link-requests", response_model=List[LinkRequestOut])
async def get_link_requests(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = select(LinkRequest, Therapist, User).join(
        Therapist, LinkRequest.therapist_id == Therapist.id
    ).join(
        User, Therapist.user_id == User.id
    )
    if status:
        query = query.where(LinkRequest.status == status)
    
    result = await db.execute(query)
    rows = result.all()
    
    response = []
    for link_req, therapist, user in rows:
        response.append(LinkRequestOut(
            id=link_req.id,
            therapist_id=link_req.therapist_id,
            therapist_name=user.name,
            therapist_email=user.email,
            client_email=link_req.client_email,
            status=link_req.status,
            requested_at=link_req.requested_at,
            resolved_at=link_req.resolved_at
        ))
    return response


@router.post("/link-requests")
async def create_link_request(
    payload: LinkRequestAdminCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    client_result = await db.execute(select(User).where(User.email == payload.client_email, User.role == UserRole.client))
    client = client_result.scalars().first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client user not found")
    
    therapist = await db.get(Therapist, payload.therapist_id)
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")
    
    existing_link = await db.execute(
        select(TherapistClient).where(
            TherapistClient.therapist_id == therapist.id,
            TherapistClient.client_id == client.id
        )
    )
    if existing_link.scalars().first():
        raise HTTPException(status_code=400, detail="Already linked")
    
    new_link = TherapistClient(
        therapist_id=therapist.id,
        client_id=client.id,
        is_active=True
    )
    db.add(new_link)
    await db.commit()
    await db.refresh(new_link)
    return new_link


@router.patch("/link-requests/{request_id}/approve")
async def approve_link_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    req = await db.get(LinkRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Link request not found")
    
    req.status = "approved"
    req.resolved_at = func.now()
    req.resolved_by = admin.id
    
    client_result = await db.execute(select(User).where(User.email == req.client_email, User.role == UserRole.client))
    client = client_result.scalars().first()
    
    note = None
    if client:
        existing_link = await db.execute(
            select(TherapistClient).where(
                TherapistClient.therapist_id == req.therapist_id,
                TherapistClient.client_id == client.id
            )
        )
        if not existing_link.scalars().first():
            new_link = TherapistClient(
                therapist_id=req.therapist_id,
                client_id=client.id,
                is_active=True
            )
            db.add(new_link)
    else:
        note = "Approved, but client email not found in system."
        
    await db.commit()
    await db.refresh(req)
    
    return {"message": "Approved", "note": note}


@router.patch("/link-requests/{request_id}/reject")
async def reject_link_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    req = await db.get(LinkRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Link request not found")
    
    req.status = "rejected"
    req.resolved_at = func.now()
    req.resolved_by = admin.id
    
    await db.commit()
    await db.refresh(req)
    return {"message": "Rejected"}


@router.get("/quotes", response_model=List[QuoteAdminOut])
async def get_quotes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    flagged: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = (
        select(Quote, QuotePack.name, User.name)
        .outerjoin(QuotePackItem, Quote.id == QuotePackItem.quote_id)
        .outerjoin(QuotePack, QuotePackItem.pack_id == QuotePack.id)
        .outerjoin(Therapist, QuotePack.therapist_id == Therapist.id)
        .outerjoin(User, Therapist.user_id == User.id)
    )
    if flagged is not None:
        query = query.where(Quote.flagged == flagged)
        
    query = query.order_by(desc(Quote.created_at)).offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    rows = result.all()
    
    response = []
    for quote, pack_name, therapist_name in rows:
        response.append(QuoteAdminOut(
            id=quote.id,
            content=quote.content,
            pack_name=pack_name,
            tags=quote.tags,
            therapist_name=therapist_name,
            flagged=quote.flagged
        ))
    return response


@router.patch("/quotes/{quote_id}/flag")
async def flag_quote(
    quote_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    quote = await db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    quote.flagged = not quote.flagged
    await db.commit()
    await db.refresh(quote)
    return {"message": "Flag toggled", "flagged": quote.flagged}


@router.delete("/quotes/{quote_id}")
async def delete_quote(
    quote_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    quote = await db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    await db.delete(quote)
    await db.commit()
    return {"message": "Quote deleted"}


@router.get("/metrics", response_model=MetricsOut)
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    total_users = await db.scalar(select(func.count(User.id)))
    total_checkins = await db.scalar(select(func.count(Session.id)))
    
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    
    checkins_7d = await db.scalar(select(func.count(Session.id)).where(Session.created_at >= seven_days_ago))
    checkins_30d = await db.scalar(select(func.count(Session.id)).where(Session.created_at >= thirty_days_ago))
    
    emotion_counts = await db.execute(
        select(EmotionLog.primary_emotion, func.count(EmotionLog.id))
        .group_by(EmotionLog.primary_emotion)
    )
    emotion_distribution = {row[0]: row[1] for row in emotion_counts.all()}
    
    avg_intensity = await db.scalar(select(func.avg(EmotionLog.intensity)))
    avg_intensity = float(avg_intensity) if avg_intensity else 0.0
    
    daily_checkins_query = (
        select(
            cast(Session.created_at, Date).label("date"),
            func.count(Session.id)
        )
        .where(Session.created_at >= thirty_days_ago)
        .group_by(cast(Session.created_at, Date))
        .order_by(cast(Session.created_at, Date))
    )
    daily_checkins_result = await db.execute(daily_checkins_query)
    daily_checkins = [
        DayMoodPoint(date=str(row[0]), count=row[1]) 
        for row in daily_checkins_result.all()
    ]
    
    sessions_query = (
        select(Session.user_id, EmotionLog.primary_emotion)
        .join(EmotionLog, Session.id == EmotionLog.session_id)
        .order_by(Session.user_id, Session.created_at.desc())
    )
    sessions_result = await db.execute(sessions_query)
    sessions_rows = sessions_result.all()
    
    low_mood_emotions = {PrimaryEmotion.Sad, PrimaryEmotion.Afraid, PrimaryEmotion.Angry, PrimaryEmotion.Bad}
    streak_counts = {}
    low_mood_users = set()
    
    for uid, primary_em in sessions_rows:
        if uid in low_mood_users:
            continue
        
        if primary_em in low_mood_emotions:
            streak_counts[uid] = streak_counts.get(uid, 0) + 1
            if streak_counts[uid] >= 3:
                low_mood_users.add(uid)
        else:
            streak_counts[uid] = -1
    
    return MetricsOut(
        total_users=total_users or 0,
        total_checkins=total_checkins or 0,
        checkins_last_7d=checkins_7d or 0,
        checkins_last_30d=checkins_30d or 0,
        emotion_distribution=emotion_distribution,
        avg_intensity_overall=avg_intensity,
        low_mood_streak_count=len(low_mood_users),
        daily_checkins_last_30d=daily_checkins
    )
