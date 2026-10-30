import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.admin_resumes import file_response
from app.db import get_db
from app.models import Resume
from app.schemas import PublicResumeOut
from app.services.resumes import label_for

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/resumes", response_model=list[PublicResumeOut])
def public_resumes(db: Session = Depends(get_db)):
    rows = db.scalars(select(Resume).where(Resume.visibility == "published", Resume.mime_type == "application/pdf")
                      .order_by(Resume.updated_at.desc()))
    return [PublicResumeOut(id=r.id, title=r.title, category_key=r.category_key, category_label=label_for(r),
                            version=r.version, description=r.description, file_size_bytes=r.file_size_bytes,
                            is_default=r.is_default_for_category, updated_at=r.updated_at,
                            published_at=r.published_at) for r in rows]


@router.get("/resumes/{rid}/download")
def public_download(rid: uuid.UUID, db: Session = Depends(get_db)):
    r = db.get(Resume, rid)
    # 404 (not 403) for anything not published so drafts/archives are indistinguishable from missing
    if not r or r.visibility != "published":
        raise HTTPException(404, "Resume not found")
    return file_response(r)
