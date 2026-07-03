# IMPORTANT: FastAPI must NEVER be exposed directly to the internet.
# It should only accept connections from the Next.js server (internal network).
# In production: use a firewall rule or private VPC to block direct 
# browser access to the FastAPI port.
# The X-User-ID header is trusted implicitly — if FastAPI is exposed 
# publicly, anyone can spoof this header and impersonate any user.

from fastapi import Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User, UserRole
import uuid

async def get_current_user(
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Trusts the X-User-ID header injected by the Next.js proxy.
    Next.js verifies the JWT from the httpOnly cookie and extracts 
    the user ID before forwarding to FastAPI.
    Never expose FastAPI directly to the browser.
    """
    try:
        user_id = uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-ID header")
    
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_therapist(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.therapist:
        raise HTTPException(status_code=403, detail="Therapist access required")
    return current_user

async def require_client(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.client:
        raise HTTPException(status_code=403, detail="Client access required")
    return current_user

async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
