"""
Pydantic schemas for request validation and response serialisation.
Kept separate from SQLAlchemy models intentionally — the API contract
should not be coupled to the DB layer.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from models import PrimaryEmotion, Reaction, SecondaryEmotion, TertiaryEmotion, TimeOfDay


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: Optional[str]
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
    user_id: uuid.UUID
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
