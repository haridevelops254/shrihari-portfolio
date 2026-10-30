import hashlib
import hmac
import secrets
import time
from collections import defaultdict, deque

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from itsdangerous import BadSignature, URLSafeTimedSerializer

from app.core.config import get_settings

_ph = PasswordHasher()  # Argon2id by default
_DUMMY_HASH = _ph.hash("not-a-real-password")
MIN_PASSWORD_LENGTH = 12


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    """Verifies against a dummy hash when the user is unknown, so timing does not reveal accounts."""
    try:
        ok = _ph.verify(password_hash or _DUMMY_HASH, password)
    except (VerificationError, InvalidHashError):
        return False
    return ok and password_hash is not None


def password_version(password_hash: str) -> str:
    return hashlib.sha256(password_hash.encode()).hexdigest()[:16]


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().session_secret, salt="admin-session")


def make_session(user_id: str, password_hash: str) -> tuple[str, str]:
    csrf = secrets.token_urlsafe(32)
    token = _serializer().dumps({"uid": user_id, "csrf": csrf, "pv": password_version(password_hash)})
    return token, csrf


def read_session(token: str | None) -> dict | None:
    if not token:
        return None
    try:
        data = _serializer().loads(token, max_age=get_settings().session_ttl_minutes * 60)
    except BadSignature:
        return None
    return data if isinstance(data, dict) and {"uid", "csrf", "pv"} <= data.keys() else None


def csrf_ok(expected: str, supplied: str | None) -> bool:
    return bool(supplied) and hmac.compare_digest(expected, supplied or "")


class RateLimiter:
    """In-memory sliding window. Fine for one Railway instance; use Redis if you scale out."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, limit: int, window: int) -> bool:
        now = time.monotonic()
        q = self._hits[key]
        while q and now - q[0] > window:
            q.popleft()
        if len(q) >= limit:
            return False
        q.append(now)
        return True

    def reset(self, key: str) -> None:
        self._hits.pop(key, None)

    def clear(self) -> None:
        self._hits.clear()


limiter = RateLimiter()
