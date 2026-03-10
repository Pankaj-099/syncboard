from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.models import task, audit_log, comment  # import all models
from app.api import tasks, webhooks, audit_logs, analytics, websocket, comments

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskBoard API",
    description="B2B Task Board — FastAPI + Clerk + Redis + WebSockets",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate Limiting ──
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware

    limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
except ImportError:
    pass

# ── Routers ──
app.include_router(tasks.router)
app.include_router(comments.router)
app.include_router(webhooks.router)
app.include_router(audit_logs.router)
app.include_router(analytics.router)
app.include_router(websocket.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
