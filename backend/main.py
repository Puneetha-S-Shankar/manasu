import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import quotes, sessions
from routers.therapist import router as therapist_router
from tasks.scheduler import start_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("manasu")

app = FastAPI(
    title="Emotional Wellness API",
    description="Backend for the emotional wheel + quote delivery app",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %s  (%.0fms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed,
    )
    return response

app.include_router(sessions.router)
app.include_router(quotes.router)
app.include_router(therapist_router)


@app.on_event("startup")
async def on_startup():
    start_scheduler()


@app.get("/health")
async def health():
    return {"status": "ok"}
