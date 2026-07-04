import asyncio
from database import AsyncSessionLocal
from models import Session, User, QuoteDelivery, Quote
from sqlalchemy import select
from sqlalchemy.orm import selectinload, contains_eager
import sys

async def main():
    async with AsyncSessionLocal() as db:
        # Get latest user who has a session
        result = await db.execute(
            select(User)
            .join(Session)
            .order_by(Session.created_at.desc())
            .limit(1)
        )
        user = result.scalar()
        if not user:
            print("No users with sessions found.")
            return

        print(f"Found User ID: {user.id}")

        # 1. Test get_history query
        result = await db.execute(
            select(Session)
            .where(Session.user_id == user.id)
            .options(selectinload(Session.emotion_logs))
            .order_by(Session.created_at.desc())
            .limit(30)
        )
        sessions = list(result.scalars().all())
        print(f"History query returned {len(sessions)} sessions.")
        if sessions:
            print(f"First session emotion_logs: {len(sessions[0].emotion_logs)}")

        # 2. Test get_saved_quotes query
        result = await db.execute(
            select(QuoteDelivery)
            .join(QuoteDelivery.session)
            .join(QuoteDelivery.quote)
            .where(
                Session.user_id == user.id,
                QuoteDelivery.reaction == 'saved'
            )
            .options(contains_eager(QuoteDelivery.quote))
            .order_by(QuoteDelivery.created_at.desc())
        )
        quotes = list(result.scalars().all())
        print(f"Saved quotes query returned {len(quotes)} quotes.")
        if quotes:
            print(f"First quote content: {quotes[0].quote.content}")

        # Check total QuoteDeliveries for this user
        result = await db.execute(
            select(QuoteDelivery)
            .join(QuoteDelivery.session)
            .where(Session.user_id == user.id)
        )
        all_deliveries = list(result.scalars().all())
        print(f"Total quote deliveries for user: {len(all_deliveries)}")
        for d in all_deliveries:
            print(f"  Delivery ID: {d.id}, reaction: {d.reaction}")

if __name__ == "__main__":
    asyncio.run(main())
