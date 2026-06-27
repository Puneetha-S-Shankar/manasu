"""
SQLAlchemy 2.0 models — mirrors the Drizzle schema in schema.ts exactly.
Enums, table names, and column names are kept identical so both sides
of the stack read from the same Postgres tables without confusion.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


# ---------------------------------------------------------------------------
# Python enums — must match the pgEnum values in schema.ts exactly
# Uses 3-tier naming: Primary → Secondary → Tertiary
# ---------------------------------------------------------------------------

class PrimaryEmotion(str, enum.Enum):
    """Tier 1: Inner ring of the emotion wheel."""
    Bad      = "Bad"
    Afraid   = "Afraid"
    Angry    = "Angry"
    Disgust  = "Disgust"
    Sad      = "Sad"
    Happy    = "Happy"
    Surprise = "Surprise"


class SecondaryEmotion(str, enum.Enum):
    """Tier 2: Middle ring of the emotion wheel."""
    # Bad
    Boredom  = "Boredom"
    Busy     = "Busy"
    Stress   = "Stress"
    Tired    = "Tired"
    # Afraid
    Scared   = "Scared"
    Anxious  = "Anxious"
    Insecure = "Insecure"
    Weak     = "Weak"
    Shaky    = "Shaky"
    Nervous  = "Nervous"
    # Angry
    Mistrust    = "Mistrust"
    Shame       = "Shame"
    Jealous     = "Jealous"
    Mad         = "Mad"
    Irritation  = "Irritation"
    Frustration = "Frustration"
    Distant     = "Distant"
    Critical    = "Critical"
    # Disgust
    Disapproval = "Disapproval"
    Disdain     = "Disdain"
    Sick        = "Sick"
    Repulsion   = "Repulsion"
    # Sad
    Hurt       = "Hurt"
    Depression = "Depression"
    Guilty     = "Guilty"
    Despair    = "Despair"
    Vulnerable = "Vulnerable"
    Lonely     = "Lonely"
    # Happy
    Hope       = "Hope"
    Trust      = "Trust"
    Care       = "Care"
    Powerful   = "Powerful"
    Acceptance = "Acceptance"
    Proud      = "Proud"
    Curiosity  = "Curiosity"
    Content    = "Content"
    Playful    = "Playful"
    # Surprise
    Excitement = "Excitement"
    Amazement  = "Amazement"
    Confusion  = "Confusion"
    Shock      = "Shock"


class TertiaryEmotion(str, enum.Enum):
    """Tier 3: Outer ring of the emotion wheel."""
    # Bad > Boredom
    Absent          = "Absent"
    Apathy          = "Apathy"
    # Bad > Busy
    Buzzy           = "Buzzy"
    Pressure        = "Pressure"
    # Bad > Stress
    Overwhelmed     = "Overwhelmed"
    Out_of_control  = "Out of control"
    # Bad > Tired
    Sleepy          = "Sleepy"
    Blurry          = "Blurry"
    # Afraid > Scared
    Helpless        = "Helpless"
    Fearful         = "Fearful"
    # Afraid > Anxious
    Overwhelm       = "Overwhelm"
    Worry           = "Worry"
    # Afraid > Insecure
    Small           = "Small"
    Inferior        = "Inferior"
    # Afraid > Weak
    Hollow          = "Hollow"
    Empty           = "Empty"
    # Afraid > Shaky
    Trembling       = "Trembling"
    Unstable        = "Unstable"
    # Afraid > Nervous
    Tight           = "Tight"
    Vulnerable      = "Vulnerable"
    # Angry > Mistrust
    Exhaustion      = "Exhaustion"
    Resentment      = "Resentment"
    # Angry > Shame
    Humiliation     = "Humiliation"
    Embarrassment   = "Embarrassment"
    # Angry > Jealous
    Indignant       = "Indignant"
    Bitter          = "Bitter"
    # Angry > Mad
    Furious         = "Furious"
    Rage            = "Rage"
    # Angry > Irritation
    Aggressive      = "Aggressive"
    Hostile         = "Hostile"
    # Angry > Frustration
    Tense           = "Tense"
    Annoyance       = "Annoyance"
    # Angry > Distant
    Withdrawn       = "Withdrawn"
    Numb            = "Numb"
    # Angry > Critical
    Skeptical       = "Skeptical"
    Dismissive      = "Dismissive"
    # Disgust > Disapproval
    Judgment        = "Judgment"
    Shock           = "Shock"
    # Disgust > Disdain
    Revulsion       = "Revulsion"
    Yucky           = "Yucky"
    # Disgust > Sick
    Nausea          = "Nausea"
    Awful           = "Awful"
    # Disgust > Repulsion
    Horror          = "Horror"
    Hesitance       = "Hesitance"
    # Sad > Hurt
    Pain            = "Pain"
    Disappointment  = "Disappointment"
    # Sad > Depression
    Heavy           = "Heavy"
    Weight          = "Weight"
    # Sad > Guilty
    Remorseful      = "Remorseful"
    Shame           = "Shame"
    # Sad > Despair
    Powerless       = "Powerless"
    Grief           = "Grief"
    # Sad > Vulnerable
    Fragile         = "Fragile"
    Shaky           = "Shaky"
    # Sad > Lonely
    Longing         = "Longing"
    Achy            = "Achy"
    # Happy > Hope
    Inspiration     = "Inspiration"
    Openness        = "Openness"
    # Happy > Trust
    Safety          = "Safety"
    Tenderness      = "Tenderness"
    # Happy > Care
    Gratitude       = "Gratitude"
    Peaceful        = "Peaceful"
    # Happy > Powerful
    Creative        = "Creative"
    Courageous      = "Courageous"
    # Happy > Acceptance
    Importance      = "Importance"
    Respect         = "Respect"
    # Happy > Proud
    Confident       = "Confident"
    Strong          = "Strong"
    # Happy > Curiosity
    Willingness     = "Willingness"
    Interest        = "Interest"
    # Happy > Content
    Joy             = "Joy"
    Free            = "Free"
    # Happy > Playful
    Mischievous     = "Mischievous"
    Arousal         = "Arousal"
    # Surprise > Excitement
    Energetic       = "Energetic"
    Eager           = "Eager"
    # Surprise > Amazement
    Awe             = "Awe"
    Astonishment    = "Astonishment"
    # Surprise > Confusion
    Dizzy           = "Dizzy"
    Unclear         = "Unclear"
    # Surprise > Shock
    Dismay          = "Dismay"
    Uncomfortable   = "Uncomfortable"


class TimeOfDay(str, enum.Enum):
    morning   = "morning"
    afternoon = "afternoon"
    evening   = "evening"
    night     = "night"


class QuoteSource(str, enum.Enum):
    generated = "generated"
    curated   = "curated"


class Reaction(str, enum.Enum):
    helped = "helped"
    missed = "missed"
    saved  = "saved"


# ---------------------------------------------------------------------------
# ORM Models
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id:         Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email:      Mapped[str]              = mapped_column(String(255), unique=True, nullable=False)
    name:       Mapped[str | None]       = mapped_column(String(100))
    created_at: Mapped[datetime]         = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime]         = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sessions: Mapped[list["Session"]] = relationship("Session", back_populates="user")


class Session(Base):
    __tablename__ = "sessions"

    id:          Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:     Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    time_of_day: Mapped[TimeOfDay | None] = mapped_column(Enum(TimeOfDay, name="time_of_day"))
    notes:       Mapped[str | None]       = mapped_column(Text)
    created_at:  Mapped[datetime]         = mapped_column(DateTime(timezone=True), server_default=func.now())

    user:             Mapped["User"]                  = relationship("User", back_populates="sessions")
    emotion_logs:     Mapped[list["EmotionLog"]]      = relationship("EmotionLog", back_populates="session")
    quote_deliveries: Mapped[list["QuoteDelivery"]]   = relationship("QuoteDelivery", back_populates="session")


class EmotionLog(Base):
    __tablename__ = "emotion_logs"

    id:                Mapped[uuid.UUID]               = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id:        Mapped[uuid.UUID]               = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    primary_emotion:   Mapped[PrimaryEmotion]          = mapped_column(Enum(PrimaryEmotion, name="primary_emotion"), nullable=False)
    secondary_emotion: Mapped[SecondaryEmotion]        = mapped_column(Enum(SecondaryEmotion, name="secondary_emotion"), nullable=False)
    tertiary_emotion:  Mapped[TertiaryEmotion | None]  = mapped_column(Enum(TertiaryEmotion, name="tertiary_emotion"))
    intensity:         Mapped[int | None]              = mapped_column(Integer, default=3)
    created_at:        Mapped[datetime]                = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["Session"] = relationship("Session", back_populates="emotion_logs")


class Quote(Base):
    __tablename__ = "quotes"

    id:                     Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content:                Mapped[str]            = mapped_column(Text, nullable=False)
    author:                 Mapped[str | None]     = mapped_column(String(200))
    source:                 Mapped[QuoteSource]    = mapped_column(Enum(QuoteSource, name="quote_source"), default=QuoteSource.generated, nullable=False)
    tags:                   Mapped[list]           = mapped_column(JSONB, default=list)
    target_primary_emotions: Mapped[list]          = mapped_column(JSONB, default=list)
    created_at:             Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now())

    deliveries: Mapped[list["QuoteDelivery"]] = relationship("QuoteDelivery", back_populates="quote")


class QuoteDelivery(Base):
    __tablename__ = "quote_deliveries"

    id:              Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id:      Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    quote_id:        Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("quotes.id", ondelete="SET NULL"))
    prompt_snapshot: Mapped[str | None]      = mapped_column(Text)
    was_skipped:     Mapped[bool]            = mapped_column(Boolean, default=False, nullable=False)
    reaction:        Mapped[Reaction | None] = mapped_column(Enum(Reaction, name="reaction"))
    created_at:      Mapped[datetime]        = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["Session"]      = relationship("Session", back_populates="quote_deliveries")
    quote:   Mapped["Quote | None"] = relationship("Quote", back_populates="deliveries")