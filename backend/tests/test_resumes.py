import pytest
from sqlalchemy import select

from app.db import SessionLocal
from app.models import AuditEvent
from tests.conftest import PDF, PW, make_docx, upload


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/api/health/ready").status_code == 200


def test_admin_routes_require_auth(client):
    for method, path in [("get", "/api/admin/resumes"), ("get", "/api/admin/stats"),
                         ("post", "/api/admin/resumes"), ("get", "/api/admin/auth/me")]:
        assert getattr(client, method)(path).status_code == 401


def test_login_failure_and_rate_limit(client):
    for _ in range(5):
        assert client.post("/api/admin/auth/login", json={"email": "admin@example.com", "password": "nope"}).status_code == 401
    assert client.post("/api/admin/auth/login", json={"email": "admin@example.com", "password": PW}).status_code == 429


def test_csrf_required_for_mutations(admin):
    admin.headers.pop("X-CSRF-Token")
    assert upload(admin).status_code == 403


def test_cookie_flags(client):
    r = client.post("/api/admin/auth/login", json={"email": "admin@example.com", "password": PW})
    c = r.headers["set-cookie"].lower()
    assert "httponly" in c and "samesite=lax" in c


def test_upload_validation(admin):
    assert upload(admin, name="x.exe", data=b"MZ", mime="application/octet-stream").status_code == 415
    assert upload(admin, name="fake.pdf", data=b"not a pdf").status_code == 415
    assert upload(admin, name="fake.docx", data=b"PKnotzip", mime="application/octet-stream").status_code == 415
    assert upload(admin, name="big.pdf", data=PDF + b"0" * (300 * 1024)).status_code == 413
    assert upload(admin, name="e.pdf", data=b"").status_code == 400
    assert upload(admin, name="a.pdf", mime="text/html").status_code == 415
    assert upload(admin, category="bogus").status_code == 422
    assert upload(admin, category="custom").status_code == 422
    assert upload(admin, title="   ").status_code == 422


def test_filename_sanitised_and_no_secrets(admin):
    r = upload(admin, title="Sanitise", name="../../etc/pass wd<script>.pdf")
    assert r.status_code == 201
    body = r.json()
    assert "/" not in body["original_filename"] and "<" not in body["original_filename"]
    assert "storage_key" not in body and "created_by" not in body


def test_draft_not_public_publish_unpublish(admin):
    rid = upload(admin, title="Pub flow").json()["id"]
    assert admin.get(f"/api/public/resumes/{rid}/download").status_code == 404
    assert rid not in [x["id"] for x in admin.get("/api/public/resumes").json()]
    assert admin.post(f"/api/admin/resumes/{rid}/publish").json()["visibility"] == "published"
    d = admin.get(f"/api/public/resumes/{rid}/download")
    assert d.status_code == 200 and d.content == PDF and "attachment" in d.headers["content-disposition"]
    pub = [x for x in admin.get("/api/public/resumes").json() if x["id"] == rid][0]
    assert "storage_key" not in pub and "checksum_sha256" not in pub
    admin.post(f"/api/admin/resumes/{rid}/unpublish")
    assert admin.get(f"/api/public/resumes/{rid}/download").status_code == 404


def test_archived_not_public_and_default_cleared(admin):
    rid = upload(admin, title="Arch", category="data_science", publish="true", is_default_for_category="true").json()["id"]
    assert admin.get(f"/api/admin/resumes/{rid}").json()["is_default_for_category"] is True
    r = admin.post(f"/api/admin/resumes/{rid}/archive").json()
    assert r["visibility"] == "archived" and r["is_default_for_category"] is False
    assert admin.get(f"/api/public/resumes/{rid}/download").status_code == 404


def test_docx_private_only(admin):
    r = upload(admin, title="Docx", name="cv.docx", data=make_docx(), mime="application/octet-stream")
    assert r.status_code == 201 and r.json()["file_type"] == "docx"
    assert admin.post(f"/api/admin/resumes/{r.json()['id']}/publish").status_code == 422
    assert upload(admin, title="Docx2", name="cv.docx", data=make_docx(), publish="true").status_code == 422


def test_single_default_per_category(admin):
    a = upload(admin, title="A", category="agentic_ai", publish="true", is_default_for_category="true").json()["id"]
    b = upload(admin, title="B", category="agentic_ai", publish="true", is_default_for_category="true").json()["id"]
    assert admin.get(f"/api/admin/resumes/{a}").json()["is_default_for_category"] is False
    assert admin.get(f"/api/admin/resumes/{b}").json()["is_default_for_category"] is True
    assert admin.post(f"/api/admin/resumes/{a}/unpublish").status_code == 200
    assert admin.post(f"/api/admin/resumes/{a}/default").status_code == 409


def test_duplicate_title_version_conflict(admin):
    assert upload(admin, title="Dup", version="v1", category="full_stack").status_code == 201
    assert upload(admin, title="Dup", version="v1", category="full_stack").status_code == 409


def test_replace_keep_and_overwrite(admin):
    rid = upload(admin, title="Rep", version="v1", category="computer_vision").json()["id"]
    pdf2 = PDF + b"\n%v2"
    files = {"file": ("new.pdf", pdf2, "application/pdf")}
    assert admin.post(f"/api/admin/resumes/{rid}/replace", data={"keep_previous": "true", "version": "v1"}, files=files).status_code == 422
    n = admin.post(f"/api/admin/resumes/{rid}/replace", data={"keep_previous": "true", "version": "v2"}, files=files).json()
    assert n["id"] != rid and n["series_id"] and n["visibility"] == "draft"
    assert admin.get(f"/api/admin/resumes/{rid}/download").content == PDF
    assert len(admin.get(f"/api/admin/resumes/{rid}/history").json()) == 2
    o = admin.post(f"/api/admin/resumes/{rid}/replace", data={"keep_previous": "false"}, files=files).json()
    assert o["id"] == rid and admin.get(f"/api/admin/resumes/{rid}/download").content == pdf2


def test_patch_and_filters(admin):
    rid = upload(admin, title="Searchable Zebra", category="genai_rag").json()["id"]
    r = admin.patch(f"/api/admin/resumes/{rid}", json={"title": "Zebra Renamed", "description": "x"})
    assert r.json()["title"] == "Zebra Renamed"
    assert [x["id"] for x in admin.get("/api/admin/resumes", params={"q": "zebra renamed"}).json()] == [rid]
    assert admin.get("/api/admin/resumes", params={"visibility": "bogus"}).status_code == 422
    assert admin.patch(f"/api/admin/resumes/{rid}", json={"is_default_for_category": True}).status_code == 409


def test_delete_removes_file_and_audit(admin):
    from app.storage import get_storage
    rid = upload(admin, title="Del", category="solutions_product").json()["id"]
    from app.models import Resume
    with SessionLocal() as db:
        key = db.get(Resume, __import__("uuid").UUID(rid)).storage_key
    assert admin.delete(f"/api/admin/resumes/{rid}").status_code == 204
    from app.storage import StorageError
    with pytest.raises(StorageError):
        get_storage().get(key)
    assert admin.get(f"/api/admin/resumes/{rid}").status_code == 404
    with SessionLocal() as db:
        assert db.scalar(select(AuditEvent).where(AuditEvent.action == "resume.delete"))


def test_db_failure_cleans_up_orphan_file(admin, monkeypatch):
    import os
    from app.services import resumes
    from app.core.config import get_settings
    def boom(db): raise RuntimeError("db down")
    monkeypatch.setattr(resumes, "_commit", boom)
    base = get_settings().local_storage_dir
    before = sum(len(f) for _, _, f in os.walk(base))
    with pytest.raises(RuntimeError):
        upload(admin, title="Orphan")
    assert sum(len(f) for _, _, f in os.walk(base)) == before


def test_change_password_invalidates_sessions(admin, client):
    assert admin.post("/api/admin/auth/change-password", json={"current_password": "wrong-wrong-1", "new_password": "another-long-pass1"}).status_code == 400
    r = admin.post("/api/admin/auth/change-password", json={"current_password": PW, "new_password": "another-long-pass1"})
    assert r.status_code == 200
    from fastapi.testclient import TestClient
    from app.main import app
    old = TestClient(app)
    assert old.post("/api/admin/auth/login", json={"email": "admin@example.com", "password": PW}).status_code == 401
    # restore for other tests
    admin.headers["X-CSRF-Token"] = r.json()["csrf_token"]
    admin.post("/api/admin/auth/change-password", json={"current_password": "another-long-pass1", "new_password": PW})


def test_stats_and_logout(admin):
    s = admin.get("/api/admin/stats").json()
    assert s["total"] == sum(s["by_visibility"].values())
    assert admin.post("/api/admin/auth/logout").status_code == 204
    admin.cookies.clear()
    assert admin.get("/api/admin/stats").status_code == 401


def test_cors_restricted(client):
    r = client.get("/api/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in r.headers
    r = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert r.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_production_config_validation(monkeypatch):
    from app.core.config import Settings
    with pytest.raises(RuntimeError):
        Settings(app_env="production").validate_for_production()
    Settings(app_env="production", session_secret="x" * 40, storage_backend="s3", object_storage_bucket="b",
             object_storage_access_key="a", object_storage_secret_key="s",
             database_url="postgres://u:p@h/db").validate_for_production()
    assert Settings(database_url="postgres://u:p@h/db").sqlalchemy_url.startswith("postgresql+psycopg://")
