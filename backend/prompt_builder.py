"""
prompt_builder.py — the core intelligence of the app.

This module builds the prompt sent to LLM. It takes structured emotion
data and shapes it into a context-rich prompt that produces emotionally
resonant quotes rather than generic ones.

The prompt is also returned so it can be stored in quote_deliveries.prompt_snapshot
for future auditing and fine-tuning.
"""

from models import EmotionLog, Session


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _time_greeting(time_of_day: str | None) -> str:
    greetings = {
        "morning":   "It's the morning.",
        "afternoon": "It's the afternoon.",
        "evening":   "It's the evening.",
        "night":     "It's late at night.",
    }
    return greetings.get(time_of_day or "", "")


def _describe_emotion(log: EmotionLog) -> str:
    parts = [f"{log.primary_emotion.value} → {log.secondary_emotion.value}"]
    if log.tertiary_emotion:
        parts.append(f"→ {log.tertiary_emotion.value}")
    if log.intensity:
        intensity_label = {1: "mildly", 2: "somewhat", 3: "moderately", 4: "strongly", 5: "intensely"}.get(log.intensity, "")
        parts.append(f"(felt {intensity_label})")
    return " ".join(parts)


def _describe_arc(past_sessions: list[Session]) -> str:
    """Summarise the last N sessions into a readable emotional arc."""
    if not past_sessions:
        return "This is their first check-in."

    lines = []
    for i, session in enumerate(reversed(past_sessions)):
        label = ["most recently", "before that", "earlier"][min(i, 2)]
        primary_emotions = list({log.primary_emotion.value for log in session.emotion_logs})
        lines.append(f"- {label}: felt {', '.join(primary_emotions)}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main prompt builder
# ---------------------------------------------------------------------------

def build_quote_prompt(
    current_session: Session,
    past_sessions: list[Session],
) -> str:
    """
    Build the full prompt for Claude. Returns the prompt string so it can
    be stored in quote_deliveries.prompt_snapshot.
    """

    current_emotions = current_session.emotion_logs
    time_note = _time_greeting(current_session.time_of_day.value if current_session.time_of_day else None)
    notes_section = f'\nThey also wrote: "{current_session.notes}"' if current_session.notes else ""

    emotion_lines = "\n".join(
        f"  • {_describe_emotion(log)}" for log in current_emotions
    )

    arc = _describe_arc(past_sessions)

    prompt = f"""You are a compassionate guide helping someone process their emotions through carefully chosen words.

CURRENT EMOTIONAL STATE
{time_note}
The person is feeling:
{emotion_lines}{notes_section}

RECENT EMOTIONAL PATTERN (last {len(past_sessions)} check-ins)
{arc}

YOUR TASK
Generate a single quote that meets this person exactly where they are right now.

STRICT RULES:
1. Do NOT try to fix, reframe, or silver-line the emotion unless it's clearly a positive one (Happy/Surprise). 
   For difficult emotions (Sad, Afraid, Angry, Disgust, Bad), the quote should VALIDATE and WITNESS, not rescue.
2. Match the emotional weight. If they feel "Grief" or "Rage", the quote should have gravity — not be light or breezy.
3. Prefer quotes that feel intimate and human over grand philosophical statements.
4. The quote should feel like it was written for this exact moment.
5. If the emotional arc shows a pattern (e.g. 3 days of anxiety), acknowledge that weight implicitly.

RESPONSE FORMAT
Respond with ONLY valid JSON, no markdown, no explanation:
{{
  "content": "the full quote text here",
  "author": "Author Name or null if original",
  "tags": ["tag1", "tag2"],
  "reasoning": "one sentence on why this quote fits (for internal logging only)"
}}

Tags should be 1–3 of: grounding, validation, reframe, grief, anger, fear, hope, strength, acceptance, loneliness, presence, courage"""

    return prompt