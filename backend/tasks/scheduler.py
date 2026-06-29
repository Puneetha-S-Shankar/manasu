"""
APScheduler wiring for background jobs.

The scheduler runs inside the FastAPI event loop (AsyncIOScheduler). Jobs run
outside the request cycle, so they open their own DB session via
AsyncSessionLocal() rather than relying on FastAPI dependency injection.
"""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from database import AsyncSessionLocal
from tasks.mood_alerts import check_mood_alerts

logger = logging.getLogger("manasu")

scheduler = AsyncIOScheduler()


async def _run_mood_alerts() -> None:
    """Job entrypoint — owns its own session since it runs outside a request."""
    async with AsyncSessionLocal() as db:
        try:
            await check_mood_alerts(db)
        except Exception:
            logger.exception("mood_alerts | job failed")


def start_scheduler() -> None:
    """Register jobs and start the scheduler. Safe to call once on startup."""
    if scheduler.running:
        return

    scheduler.add_job(
        _run_mood_alerts,
        trigger=CronTrigger(hour=9, minute=0),  # every day at 09:00 local time
        id="check_mood_alerts",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("scheduler | started — check_mood_alerts scheduled daily at 09:00")
