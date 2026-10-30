from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import admin_guard, client_ip
from app.core.config import get_settings
from app.core.security import hash_password, limiter, make_session, verify_password
from app.db import get_db
from app.models import AdminUser
from app.schemas import ChangePasswordIn, LoginIn, SessionOut
from app.services.resumes import audit

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


def _set_cookie(resp: Response, token: str) -> None:
    s = get_settings()
    resp.set_cookie("session", token, max_age=s.session_ttl_minutes * 60, httponly=True,
                    secure=s.cookie_secure, samesite=s.cookie_samesite.lower(), path="/")


@router.post("/login", response_model=SessionOut)
def login(body: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    s = get_settings()
    key = f"login:{client_ip(request)}"
    if not limiter.check(key, s.login_max_attempts, s.login_window_seconds):
        raise HTTPException(429, "Too many login attempts. Try again later.")
    user = db.scalar(select(AdminUser).where(AdminUser.email == body.email.lower()))
    ok = verify_password(user.password_hash if user else None, body.password)
    if not ok or not user or not user.is_active:
        audit(db, None, "admin.login", None, "failure")
        db.commit()
        raise HTTPException(401, "Invalid email or password")
    limiter.reset(key)
    user.last_login_at = datetime.now(timezone.utc)
    audit(db, user, "admin.login")
    db.commit()
    token, csrf = make_session(str(user.id), user.password_hash)
    _set_cookie(response, token)
    return SessionOut(email=user.email, csrf_token=csrf)


@router.post("/logout", status_code=204)
def logout(response: Response):
    s = get_settings()
    response.delete_cookie("session", path="/", secure=s.cookie_secure, samesite=s.cookie_samesite.lower())


@router.get("/me", response_model=SessionOut)
def me(request: Request, user: AdminUser = Depends(admin_guard)):
    return SessionOut(email=user.email, csrf_token=request.state.csrf)


@router.post("/change-password", response_model=SessionOut)
def change_password(body: ChangePasswordIn, response: Response, user: AdminUser = Depends(admin_guard),
                    db: Session = Depends(get_db)):
    if not verify_password(user.password_hash, body.current_password):
        raise HTTPException(400, "Current password is incorrect")
    user.password_hash = hash_password(body.new_password)
    audit(db, user, "admin.change_password")
    db.commit()
    token, csrf = make_session(str(user.id), user.password_hash)  # old sessions become invalid
    _set_cookie(response, token)
    return SessionOut(email=user.email, csrf_token=csrf)
