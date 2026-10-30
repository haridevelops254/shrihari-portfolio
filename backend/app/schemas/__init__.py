import re
import uuid
from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, PlainSerializer, field_validator


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


UtcDate = Annotated[datetime | None, PlainSerializer(_iso, return_type=str | None)]
Visibility = Literal["draft", "published", "archived"]
_ctrl = re.compile(r"[\x00-\x1f\x7f]")


def _clean(v: str) -> str:
    return _ctrl.sub("", v).strip()


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=256)
    new_password: str = Field(min_length=12, max_length=256)


class SessionOut(BaseModel):
    email: str
    csrf_token: str


class ResumeMeta(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    category: str
    custom_category: str | None = Field(default=None, max_length=80)
    version: str = Field(min_length=1, max_length=40)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("title", "version")
    @classmethod
    def _c(cls, v: str) -> str:
        v = _clean(v)
        if not v:
            raise ValueError("must not be blank")
        return v

    @field_validator("custom_category", "description")
    @classmethod
    def _c2(cls, v: str | None) -> str | None:
        return (_clean(v) or None) if v else None


class ResumePatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    category: str | None = None
    custom_category: str | None = Field(default=None, max_length=80)
    version: str | None = Field(default=None, min_length=1, max_length=40)
    description: str | None = Field(default=None, max_length=1000)
    is_default_for_category: bool | None = None


class AdminResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    series_id: uuid.UUID
    title: str
    category: str
    category_label: str = ""
    custom_category: str | None
    category_key: str
    version: str
    description: str | None
    original_filename: str
    mime_type: str
    file_type: str = ""
    file_size_bytes: int
    checksum_sha256: str
    visibility: Visibility
    is_default_for_category: bool
    created_at: UtcDate
    updated_at: UtcDate
    published_at: UtcDate


class PublicResumeOut(BaseModel):
    id: uuid.UUID
    title: str
    category_key: str
    category_label: str = ""
    version: str
    description: str | None
    file_size_bytes: int
    is_default: bool
    updated_at: UtcDate
    published_at: UtcDate


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    action: str
    resume_id: uuid.UUID | None
    outcome: str
    created_at: UtcDate
