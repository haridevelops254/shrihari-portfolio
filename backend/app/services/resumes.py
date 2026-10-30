import logging
import re
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.categories import CATEGORIES
from app.models import AuditEvent, Resume
from app.services.files import ValidatedFile
from app.storage import StorageError, get_storage

log = logging.getLogger("resumes")


def category_key(category: str, custom: str | None) -> str:
    if category not in CATEGORIES:
        raise HTTPException(422, "Unknown category")
    if category != "custom":
        return category
    slug = re.sub(r"[^a-z0-9]+", "-", (custom or "").lower()).strip("-")
    if not slug:
        raise HTTPException(422, "A custom category name is required")
    return f"custom:{slug}"[:100]


def label_for(r: Resume) -> str:
    return (r.custom_category or "Custom category") if r.category == "custom" else CATEGORIES.get(r.category, r.category)


def audit(db: Session, actor, action: str, resume_id=None, outcome="success") -> None:
    db.add(AuditEvent(actor_id=getattr(actor, "id", None), action=action, resume_id=resume_id, outcome=outcome))


def get_or_404(db: Session, rid: uuid.UUID) -> Resume:
    r = db.get(Resume, rid)
    if not r:
        raise HTTPException(404, "Resume not found")
    return r


def _conflict(e: IntegrityError) -> HTTPException:
    if "one_default" in str(e.orig) or "is_default_for_category" in str(e.orig):
        return HTTPException(409, "A default already exists for this category")
    return HTTPException(409, "A resume with this title and version already exists in this category")


def _commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise _conflict(e) from e


def _safe_delete(key: str) -> None:
    try:
        get_storage().delete(key)
    except StorageError:
        log.warning("Could not delete object %s; it is now orphaned and can be removed manually", key)


def _put(f: ValidatedFile) -> str:
    key = f.new_key()
    try:
        get_storage().put(key, f.data, f.mime)
    except StorageError as e:
        raise HTTPException(503, "File storage is unavailable. Nothing was saved; please retry.") from e
    return key


def _apply_file(r: Resume, f: ValidatedFile, key: str) -> None:
    r.original_filename, r.storage_key, r.mime_type = f.display_name, key, f.mime
    r.file_size_bytes, r.checksum_sha256 = f.size, f.sha256


def create(db: Session, actor, meta, f: ValidatedFile, publish: bool, make_default: bool) -> Resume:
    key_cat = category_key(meta.category, meta.custom_category)
    if publish and f.ext != "pdf":
        raise HTTPException(422, "Only PDF files can be published")
    key = _put(f)
    sid = uuid.uuid4()
    r = Resume(id=uuid.uuid4(), series_id=sid, title=meta.title, category=meta.category,
               custom_category=meta.custom_category if meta.category == "custom" else None,
               category_key=key_cat, version=meta.version, description=meta.description,
               visibility="draft", created_by=getattr(actor, "id", None))
    _apply_file(r, f, key)
    db.add(r)
    try:
        db.flush()
        if publish:
            _publish_in_session(db, r, make_default)
        audit(db, actor, "resume.create", r.id)
        _commit(db)
    except IntegrityError as e:
        db.rollback()
        _safe_delete(key)
        raise _conflict(e) from e
    except Exception:
        db.rollback()
        _safe_delete(key)  # no orphan when metadata save fails
        raise
    return r


def _publish_in_session(db: Session, r: Resume, make_default: bool) -> None:
    if not r.mime_type.endswith("pdf"):
        raise HTTPException(422, "Only PDF files can be published")
    r.visibility, r.published_at = "published", datetime.now(timezone.utc)
    if make_default:
        _set_default(db, r)


def _set_default(db: Session, r: Resume) -> None:
    db.execute(update(Resume).where(Resume.category_key == r.category_key, Resume.id != r.id)
               .values(is_default_for_category=False))
    db.flush()
    r.is_default_for_category = True


def publish(db: Session, actor, r: Resume, make_default: bool = False) -> Resume:
    _publish_in_session(db, r, make_default)
    audit(db, actor, "resume.publish", r.id)
    _commit(db)
    return r


def _retire(r: Resume, state: str) -> None:
    r.visibility, r.is_default_for_category = state, False
    if state != "published":
        r.published_at = None


def unpublish(db: Session, actor, r: Resume) -> Resume:
    _retire(r, "draft")
    audit(db, actor, "resume.unpublish", r.id)
    _commit(db)
    return r


def archive(db: Session, actor, r: Resume) -> Resume:
    _retire(r, "archived")  # a default that is archived stops being default
    audit(db, actor, "resume.archive", r.id)
    _commit(db)
    return r


def make_default(db: Session, actor, r: Resume) -> Resume:
    if r.visibility != "published":
        raise HTTPException(409, "Only a published resume can be the default")
    _set_default(db, r)
    audit(db, actor, "resume.set_default", r.id)
    _commit(db)
    return r


def patch(db: Session, actor, r: Resume, data) -> Resume:
    d = data.model_dump(exclude_unset=True)
    want_default = d.pop("is_default_for_category", None)
    for k in ("title", "version"):
        if k in d and d[k] is not None:
            r.__setattr__(k, d[k].strip())
    if "description" in d:
        r.description = (d["description"] or "").strip() or None
    if "category" in d or "custom_category" in d:
        cat = d.get("category") or r.category
        cust = d.get("custom_category", r.custom_category)
        new_key = category_key(cat, cust)
        if new_key != r.category_key:
            r.is_default_for_category = False  # defaults never silently move between categories
        r.category, r.category_key = cat, new_key
        r.custom_category = (cust or None) if cat == "custom" else None
    if want_default is True:
        if r.visibility != "published":
            raise HTTPException(409, "Only a published resume can be the default")
        _set_default(db, r)
    elif want_default is False:
        r.is_default_for_category = False
    audit(db, actor, "resume.update", r.id)
    _commit(db)
    return r


def replace(db: Session, actor, r: Resume, f: ValidatedFile, keep_previous: bool, version: str | None) -> Resume:
    if keep_previous:
        if not version or version.strip() == r.version:
            raise HTTPException(422, "Provide a new version identifier to keep the previous file")
        key = _put(f)
        n = Resume(id=uuid.uuid4(), series_id=r.series_id, title=r.title, category=r.category,
                   custom_category=r.custom_category, category_key=r.category_key,
                   version=version.strip()[:40], description=r.description, visibility="draft",
                   created_by=getattr(actor, "id", None))
        _apply_file(n, f, key)
        db.add(n)
        try:
            audit(db, actor, "resume.replace_keep", r.id)
            _commit(db)
        except Exception:
            db.rollback()
            _safe_delete(key)
            raise
        return n
    if r.visibility == "published" and f.ext != "pdf":
        raise HTTPException(422, "A published resume must stay a PDF; unpublish it first")
    old_key, key = r.storage_key, _put(f)
    _apply_file(r, f, key)
    if version and version.strip():
        r.version = version.strip()[:40]
    try:
        audit(db, actor, "resume.replace_overwrite", r.id)
        _commit(db)
    except Exception:
        db.rollback()
        _safe_delete(key)
        raise
    _safe_delete(old_key)
    return r


def delete(db: Session, actor, r: Resume) -> None:
    key, rid = r.storage_key, r.id
    db.delete(r)
    audit(db, actor, "resume.delete", rid)
    _commit(db)
    _safe_delete(key)


def list_admin(db: Session, q: str | None, category_key_: str | None, visibility: str | None, sort: str) -> list[Resume]:
    stmt = select(Resume)
    if q:
        like = f"%{q.strip().lower()}%"
        from sqlalchemy import func, or_
        stmt = stmt.where(or_(func.lower(Resume.title).like(like), func.lower(Resume.original_filename).like(like)))
    if category_key_:
        stmt = stmt.where(Resume.category_key == category_key_)
    if visibility:
        stmt = stmt.where(Resume.visibility == visibility)
    order = {"title": Resume.title.asc(), "oldest": Resume.created_at.asc(), "updated": Resume.updated_at.desc()}
    return list(db.scalars(stmt.order_by(order.get(sort, Resume.updated_at.desc()))))
