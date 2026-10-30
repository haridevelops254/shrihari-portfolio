import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text

from app.api import admin_resumes, auth, public
from app.core.config import get_settings
from app.db import SessionLocal

log = logging.getLogger("app")
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate_for_production()
    try:
        from app.cli import ensure_initial_admin
        ensure_initial_admin()
    except Exception:  # noqa: BLE001 - e.g. migrations not yet applied
        log.warning("Initial admin bootstrap skipped (have you run 'alembic upgrade head'?)")
    yield


docs = None if settings.is_production else "/api/docs"
app = FastAPI(title="Shrihari Portfolio API", lifespan=lifespan, docs_url=docs,
              redoc_url=None, openapi_url=None if settings.is_production else "/api/openapi.json")
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=True,
                   allow_methods=["GET", "POST", "PATCH", "DELETE"], allow_headers=["Content-Type", "X-CSRF-Token"])


@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("Referrer-Policy", "no-referrer")
    if request.url.path.startswith("/api/admin") or request.url.path.startswith("/api/public/resumes"):
        resp.headers["Cache-Control"] = "no-store"
    return resp


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    log.exception("Unhandled error: %s", type(exc).__name__)  # message omitted: may contain secrets
    return JSONResponse({"detail": "Internal server error"}, status_code=500)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/health/ready")
def ready():
    try:
        with SessionLocal() as db:
            db.execute(text("select 1"))
        return {"status": "ready"}
    except Exception:  # noqa: BLE001
        return JSONResponse({"status": "database unavailable"}, status_code=503)


for r in (public.router, auth.router, admin_resumes.router):
    app.include_router(r, prefix="/api")
