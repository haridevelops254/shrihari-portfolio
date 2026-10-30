import uuid

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.security import csrf_ok, password_version, read_session
from app.db import get_db
from app.models import AdminUser

SAFE = {"GET", "HEAD", "OPTIONS"}


def client_ip(request: Request) -> str:
    from app.core.config import get_settings
    if get_settings().trust_proxy:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def admin_guard(request: Request, db: Session = Depends(get_db)) -> AdminUser:
    """Server-side authentication + CSRF check for every admin endpoint."""
    sess = read_session(request.cookies.get("session"))
    if not sess:
        raise HTTPException(401, "Not authenticated")
    try:
        user = db.get(AdminUser, uuid.UUID(sess["uid"]))
    except ValueError:
        user = None
    if not user or not user.is_active or password_version(user.password_hash) != sess["pv"]:
        raise HTTPException(401, "Not authenticated")
    if request.method not in SAFE and not csrf_ok(sess["csrf"], request.headers.get("x-csrf-token")):
        raise HTTPException(403, "Missing or invalid CSRF token")
    request.state.csrf = sess["csrf"]
    return user
