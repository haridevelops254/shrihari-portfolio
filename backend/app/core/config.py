"""Settings. Every value comes from environment variables (see ../.env.example).

NOTE: list-like values (FRONTEND_ORIGIN) are plain comma-separated strings on purpose.
pydantic-settings tries to JSON-decode list fields from env vars, which breaks on
platforms such as Railway when the value is not valid JSON.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"  # development | test | production
    database_url: str = "sqlite:///./dev.db"
    frontend_origin: str = "http://localhost:5173"  # comma-separated list allowed

    session_secret: str = "dev-only-change-me-dev-only-change-me"
    session_ttl_minutes: int = 480
    cookie_samesite: str = "lax"  # lax (same-origin proxy) | none (cross-site, needs HTTPS)

    initial_admin_email: str = ""
    initial_admin_password: str = ""

    storage_backend: str = "local"  # local | s3
    local_storage_dir: str = "./storage"
    object_storage_endpoint: str = ""  # blank = AWS S3; set for R2 / MinIO / etc.
    object_storage_bucket: str = ""
    object_storage_region: str = "auto"
    object_storage_access_key: str = ""
    object_storage_secret_key: str = ""

    max_upload_size_bytes: int = 10 * 1024 * 1024
    trust_proxy: bool = True
    login_max_attempts: int = 5
    login_window_seconds: int = 900

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def origins(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.frontend_origin.split(",") if o.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        url = self.database_url.strip()
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        if url.startswith("postgresql://"):
            url = "postgresql+psycopg://" + url[len("postgresql://"):]
        return url

    @property
    def cookie_secure(self) -> bool:
        return self.is_production or self.cookie_samesite.lower() == "none"

    def validate_for_production(self) -> None:
        if not self.is_production:
            return
        problems = []
        if len(self.session_secret) < 32 or self.session_secret.startswith("dev-only"):
            problems.append("SESSION_SECRET must be a random string of 32+ characters")
        if self.storage_backend != "s3":
            problems.append("STORAGE_BACKEND must be 's3' in production (local disk is ephemeral)")
        elif not (self.object_storage_bucket and self.object_storage_access_key and self.object_storage_secret_key):
            problems.append("OBJECT_STORAGE_BUCKET / ACCESS_KEY / SECRET_KEY are required")
        if self.sqlalchemy_url.startswith("sqlite"):
            problems.append("DATABASE_URL must point to PostgreSQL in production")
        if problems:
            raise RuntimeError("Invalid production configuration: " + "; ".join(problems))


@lru_cache
def get_settings() -> Settings:
    return Settings()
