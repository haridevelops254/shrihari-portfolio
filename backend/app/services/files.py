"""Server-side upload validation. We never trust the filename or the client MIME type."""
import hashlib
import io
import re
import uuid
import zipfile
from dataclasses import dataclass
from pathlib import PurePath

from fastapi import HTTPException, UploadFile

PDF_MIME = "application/pdf"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
_ALLOWED_DECLARED = {PDF_MIME, DOCX_MIME, "application/octet-stream", "", None}
_MAX_UNZIPPED = 100 * 1024 * 1024


@dataclass
class ValidatedFile:
    data: bytes
    ext: str  # pdf | docx
    mime: str
    size: int
    sha256: str
    display_name: str

    def new_key(self) -> str:
        return f"resumes/{uuid.uuid4()}.{self.ext}"


async def read_limited(file: UploadFile, max_bytes: int) -> bytes:
    buf = bytearray()
    while chunk := await file.read(64 * 1024):
        buf += chunk
        if len(buf) > max_bytes:
            raise HTTPException(413, f"File is larger than the {max_bytes // (1024 * 1024)} MB limit")
    return bytes(buf)


def sanitize_filename(name: str | None, ext: str) -> str:
    base = PurePath((name or "").replace("\\", "/")).name
    stem = PurePath(base).stem
    stem = re.sub(r"[^A-Za-z0-9._ -]+", "_", stem).strip(" ._-")[:100] or "resume"
    return f"{stem}.{ext}"


def _is_docx(data: bytes) -> bool:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            names = set(z.namelist())
            if "word/document.xml" not in names or "[Content_Types].xml" not in names:
                return False
            return sum(i.file_size for i in z.infolist()) <= _MAX_UNZIPPED
    except (zipfile.BadZipFile, OSError):
        return False


async def validate_upload(file: UploadFile | None, max_bytes: int) -> ValidatedFile:
    if file is None or not file.filename:
        raise HTTPException(400, "A file is required")
    suffix = PurePath(file.filename).suffix.lower()
    if suffix not in (".pdf", ".docx"):
        raise HTTPException(415, "Only .pdf and .docx files are accepted")
    if (file.content_type or "").split(";")[0].strip().lower() not in _ALLOWED_DECLARED:
        raise HTTPException(415, "Unsupported content type")
    data = await read_limited(file, max_bytes)
    if not data:
        raise HTTPException(400, "The uploaded file is empty")
    if suffix == ".pdf":
        if not data.startswith(b"%PDF-"):
            raise HTTPException(415, "File content is not a valid PDF")
        ext, mime = "pdf", PDF_MIME
    else:
        if not data.startswith(b"PK") or not _is_docx(data):
            raise HTTPException(415, "File content is not a valid DOCX")
        ext, mime = "docx", DOCX_MIME
    return ValidatedFile(data, ext, mime, len(data), hashlib.sha256(data).hexdigest(),
                         sanitize_filename(file.filename, ext))
