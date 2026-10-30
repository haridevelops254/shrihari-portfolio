import io
import os
import tempfile
import zipfile

_tmp = tempfile.mkdtemp()
os.environ.update(APP_ENV="test", DATABASE_URL=f"sqlite:///{_tmp}/t.db", LOCAL_STORAGE_DIR=f"{_tmp}/files",
                  SESSION_SECRET="t" * 40, FRONTEND_ORIGIN="http://localhost:5173",
                  MAX_UPLOAD_SIZE_BYTES=str(200 * 1024), INITIAL_ADMIN_EMAIL="", INITIAL_ADMIN_PASSWORD="")

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from app.core.security import hash_password, limiter
from app.db import SessionLocal
from app.main import app
from app.models import AdminUser

PW = "correct-horse-battery"
PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


def make_docx() -> bytes:
    b = io.BytesIO()
    with zipfile.ZipFile(b, "w") as z:
        z.writestr("[Content_Types].xml", "<x/>")
        z.writestr("word/document.xml", "<x/>")
    return b.getvalue()


@pytest.fixture(scope="session", autouse=True)
def _migrate():
    command.upgrade(Config("alembic.ini"), "head")  # also proves the migration works
    with SessionLocal() as db:
        db.add(AdminUser(email="admin@example.com", password_hash=hash_password(PW)))
        db.commit()


@pytest.fixture()
def client():
    limiter.clear()
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def admin(client):
    r = client.post("/api/admin/auth/login", json={"email": "admin@example.com", "password": PW})
    assert r.status_code == 200
    client.headers["X-CSRF-Token"] = r.json()["csrf_token"]
    return client


def upload(c, title="Backend Resume", version="v1", category="backend", name="cv.pdf", data=PDF,
           mime="application/pdf", **extra):
    form = {"title": title, "category": category, "version": version, **extra}
    return c.post("/api/admin/resumes", data=form, files={"file": (name, data, mime)})
