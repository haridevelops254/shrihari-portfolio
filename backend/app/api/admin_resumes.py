import uuid
from collections import Counter
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, Response, UploadFile
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import admin_guard
from app.core.categories import CATEGORIES
from app.core.config import get_settings
from app.core.security import limiter
from app.db import get_db
from app.models import AdminUser, AuditEvent, Resume
from app.schemas import AdminResumeOut, AuditOut, ResumeMeta, ResumePatch
from app.services import resumes as svc
from app.services.files import validate_upload
from app.storage import StorageError, get_storage

router = APIRouter(prefix="/admin", tags=["admin-resumes"])


def out(r: Resume) -> AdminResumeOut:
    o = AdminResumeOut.model_validate(r)
    o.category_label = svc.label_for(r)
    o.file_type = "pdf" if r.mime_type.endswith("pdf") else "docx"
    return o


def _rate(admin: AdminUser) -> None:
    if not limiter.check(f"upload:{admin.id}", 30, 600):
        raise HTTPException(429, "Too many uploads. Please wait a few minutes.")


def _meta(title, category, custom_category, version, description) -> ResumeMeta:
    try:
        return ResumeMeta(title=title, category=category, custom_category=custom_category,
                          version=version, description=description)
    except ValidationError as e:
        raise HTTPException(422, "; ".join(f"{'.'.join(map(str, x['loc']))}: {x['msg']}" for x in e.errors())) from e


def _limit(request: Request) -> None:
    cl = request.headers.get("content-length")
    if cl and cl.isdigit() and int(cl) > get_settings().max_upload_size_bytes + 1024 * 1024:
        raise HTTPException(413, "File is too large")


@router.get("/resumes", response_model=list[AdminResumeOut])
def list_resumes(q: str | None = Query(None, max_length=100), category: str | None = None,
                 visibility: str | None = Query(None, pattern="^(draft|published|archived)$"),
                 sort: str = Query("updated", pattern="^(updated|oldest|title)$"),
                 _: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    return [out(r) for r in svc.list_admin(db, q, category, visibility, sort)]


@router.get("/stats")
def stats(_: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    rows = list(db.scalars(select(Resume)))
    by_cat = Counter((r.category_key, svc.label_for(r)) for r in rows)
    return {"total": len(rows),
            "by_visibility": {v: sum(r.visibility == v for r in rows) for v in ("draft", "published", "archived")},
            "by_category": [{"key": k, "label": lbl, "count": c} for (k, lbl), c in sorted(by_cat.items(), key=lambda x: x[0][1])],
            "total_bytes": sum(r.file_size_bytes for r in rows)}


@router.get("/audit", response_model=list[AuditOut])
def recent_audit(_: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    return list(db.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(15)))


@router.get("/categories")
def categories(_: AdminUser = Depends(admin_guard)):
    return [{"key": k, "label": v} for k, v in CATEGORIES.items()]


@router.post("/resumes", response_model=AdminResumeOut, status_code=201)
async def create_resume(request: Request, title: str = Form(...), category: str = Form(...),
                        custom_category: str | None = Form(None), version: str = Form(...),
                        description: str | None = Form(None), publish: bool = Form(False),
                        is_default_for_category: bool = Form(False), file: UploadFile = File(...),
                        admin: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    _rate(admin)
    _limit(request)
    meta = _meta(title, category, custom_category, version, description)
    f = await validate_upload(file, get_settings().max_upload_size_bytes)
    return out(svc.create(db, admin, meta, f, publish, is_default_for_category and publish))


@router.get("/resumes/{rid}", response_model=AdminResumeOut)
def get_resume(rid: uuid.UUID, _: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    return out(svc.get_or_404(db, rid))


@router.get("/resumes/{rid}/history", response_model=list[AdminResumeOut])
def history(rid: uuid.UUID, _: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    r = svc.get_or_404(db, rid)
    rows = db.scalars(select(Resume).where(Resume.series_id == r.series_id).order_by(Resume.created_at.desc()))
    return [out(x) for x in rows]


@router.patch("/resumes/{rid}", response_model=AdminResumeOut)
def patch_resume(rid: uuid.UUID, body: ResumePatch, admin: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    return out(svc.patch(db, admin, svc.get_or_404(db, rid), body))


@router.post("/resumes/{rid}/replace", response_model=AdminResumeOut)
async def replace_resume(rid: uuid.UUID, request: Request, file: UploadFile = File(...),
                         keep_previous: bool = Form(True), version: str | None = Form(None),
                         admin: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    _rate(admin)
    _limit(request)
    r = svc.get_or_404(db, rid)
    f = await validate_upload(file, get_settings().max_upload_size_bytes)
    return out(svc.replace(db, admin, r, f, keep_previous, version))


class _Pub:  # tiny optional body for publish
    pass


@router.post("/resumes/{rid}/publish", response_model=AdminResumeOut)
def publish(rid: uuid.UUID, make_default: bool = Query(False), admin: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    return out(svc.publish(db, admin, svc.get_or_404(db, rid), make_default))


@router.post("/resumes/{rid}/unpublish", response_model=AdminResumeOut)
def unpublish(rid: uuid.UUID, admin: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    return out(svc.unpublish(db, admin, svc.get_or_404(db, rid)))


@router.post("/resumes/{rid}/archive", response_model=AdminResumeOut)
def archive(rid: uuid.UUID, admin: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    return out(svc.archive(db, admin, svc.get_or_404(db, rid)))


@router.post("/resumes/{rid}/default", response_model=AdminResumeOut)
def set_default(rid: uuid.UUID, admin: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    return out(svc.make_default(db, admin, svc.get_or_404(db, rid)))


@router.delete("/resumes/{rid}", status_code=204)
def delete_resume(rid: uuid.UUID, admin: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    svc.delete(db, admin, svc.get_or_404(db, rid))


def file_response(r: Resume) -> Response:
    try:
        data = get_storage().get(r.storage_key)
    except StorageError:
        raise HTTPException(503, "The file is temporarily unavailable") from None
    ascii_name = r.original_filename.encode("ascii", "ignore").decode() or "resume"
    return Response(data, media_type=r.mime_type, headers={
        "Content-Disposition": f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(r.original_filename)}",
        "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


@router.get("/resumes/{rid}/download")
def download(rid: uuid.UUID, _: AdminUser = Depends(admin_guard), db: Session = Depends(get_db)):
    return file_response(svc.get_or_404(db, rid))
