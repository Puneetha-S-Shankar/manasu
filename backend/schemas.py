"""
Pydantic schemas for request validation and response serialisation.
Kept separate from SQLAlchemy models intentionally — the API contract
should not be coupled to the DB layer.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, model_validator

from models import (
    AlertType,
    PrimaryEmotion,
    PushType,
    Reaction,
    SecondaryEmotion,
    TertiaryEmotion,
    TimeOfDay,
    UserRole,
)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: UserRole = UserRole.client
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: Optional[str]
    role: UserRole
    avatar_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

class EmotionInput(BaseModel):
    primary_emotion: PrimaryEmotion
    secondary_emotion: SecondaryEmotion
    tertiary_emotion: Optional[TertiaryEmotion] = None
    intensity: Optional[int] = 3          # 1–5


class SessionCreate(BaseModel):
    emotions: list[EmotionInput]           # one or more emotions from the wheel
    notes: Optional[str] = None
    time_of_day: Optional[TimeOfDay] = None


class EmotionLogOut(BaseModel):
    id: uuid.UUID
    primary_emotion: PrimaryEmotion
    secondary_emotion: SecondaryEmotion
    tertiary_emotion: Optional[TertiaryEmotion]
    intensity: Optional[int]

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    time_of_day: Optional[TimeOfDay]
    notes: Optional[str]
    emotion_logs: list[EmotionLogOut]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Quotes
# ---------------------------------------------------------------------------

class QuoteOut(BaseModel):
    id: uuid.UUID
    content: str
    author: Optional[str]
    tags: list[str]
    delivery_id: uuid.UUID             # quote_deliveries.id — needed for reactions

    model_config = {"from_attributes": True}


class QuoteRequest(BaseModel):
    session_id: uuid.UUID              # the session to generate a quote for


# ---------------------------------------------------------------------------
# Reactions
# ---------------------------------------------------------------------------

class ReactionUpdate(BaseModel):
    reaction: Reaction


# ---------------------------------------------------------------------------
# Therapist auth
# ---------------------------------------------------------------------------

class TherapistCreate(BaseModel):
    user_id: uuid.UUID       # must reference an existing user with role=therapist
    license_number: Optional[str] = None
    bio: Optional[str] = None


class TherapistOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email: str              # flattened from user relationship for convenience
    name: Optional[str]     # flattened from user relationship
    avatar_url: Optional[str]
    license_number: Optional[str]
    bio: Optional[str]
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def flatten_user_data(cls, v):
        # When converting from SQLAlchemy object 'Therapist', flatten the 'user' fields
        if hasattr(v, "user") and v.user:
            # We are dealing with a SQLAlchemy model instance
            # Convert to dict to avoid mutating the SQLAlchemy object directly in odd ways
            return {
                "id": v.id,
                "user_id": v.user_id,
                "email": v.user.email,
                "name": v.user.name,
                "avatar_url": v.user.avatar_url,
                "license_number": v.license_number,
                "bio": v.bio,
                "created_at": v.created_at,
            }
        return v

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Client linking
# ---------------------------------------------------------------------------

class ClientLinkCreate(BaseModel):
    client_email: EmailStr   # therapist links by client email, not raw UUID


class ClientLinkOut(BaseModel):
    id: uuid.UUID
    therapist_id: uuid.UUID
    client_id: uuid.UUID
    client_name: Optional[str]
    client_email: str
    is_active: bool
    linked_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Quote packs
# ---------------------------------------------------------------------------

class QuotePackCreate(BaseModel):
    name: str
    description: Optional[str] = None
    tags: list[str] = []


class QuotePackOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    tags: list[str]
    quote_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class QuotePackItemAdd(BaseModel):
    quote_id: Optional[uuid.UUID] = None
    content: Optional[str] = None
    tags: list[str] = []
    author: Optional[str] = None
    order: Optional[int] = None


# ---------------------------------------------------------------------------
# Therapist push
# ---------------------------------------------------------------------------

class TherapistPushCreate(BaseModel):
    client_id: uuid.UUID
    push_type: PushType
    content: Optional[str] = None
    quote_id: Optional[uuid.UUID] = None
    pack_id: Optional[uuid.UUID] = None

    @model_validator(mode="after")
    def must_have_content_or_quote(self):
        if not self.content and not self.quote_id and not self.pack_id:
            raise ValueError("Provide content, quote_id, or pack_id")
        return self


class TherapistPushOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_name: Optional[str]
    push_type: str
    content: Optional[str]
    sent_at: datetime
    seen_at: Optional[datetime]
    reaction: Optional[str]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Mood alert
# ---------------------------------------------------------------------------

class MoodAlertOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_name: Optional[str]
    alert_type: str
    reason: str
    is_read: bool
    triggered_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Dashboard summary per client (Story 2)
# ---------------------------------------------------------------------------

class DayMoodPoint(BaseModel):
    date: str                        # "2026-06-01"
    primary_emotion: Optional[str]
    avg_intensity: Optional[float]


class ClientMoodSummary(BaseModel):
    client_id: uuid.UUID
    client_name: Optional[str]
    client_email: str
    linked_since: datetime
    total_checkins: int
    last_checkin: Optional[datetime]
    most_frequent_primary: Optional[str]
    low_mood_streak: int             # consecutive sessions with low primary emotion
    low_mood_days: int               # count of low mood days in the 14-day window
    has_unread_alert: bool
    fourteen_day_trend: list[DayMoodPoint]
    recent_sessions: list["SessionOut"]

    model_config = {"from_attributes": True}
