"""Admin management CLI.

  python -m app.cli create-admin --email you@example.com     (prompts for password)
  python -m app.cli set-password --email you@example.com     (credential rotation)
Passwords are never printed or logged. INITIAL_ADMIN_* env vars are also honoured at startup
when no admin exists yet; remove INITIAL_ADMIN_PASSWORD from the environment afterwards.
"""
import argparse
import getpass
import sys

from sqlalchemy import func, select

from app.core.config import get_settings
from app.core.security import MIN_PASSWORD_LENGTH, hash_password
from app.db import SessionLocal
from app.models import AdminUser


def ensure_initial_admin() -> None:
    s = get_settings()
    if not (s.initial_admin_email and s.initial_admin_password):
        return
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(AdminUser)):
            return
        if len(s.initial_admin_password) < MIN_PASSWORD_LENGTH:
            raise RuntimeError("INITIAL_ADMIN_PASSWORD is too short")
        db.add(AdminUser(email=s.initial_admin_email.lower().strip(), password_hash=hash_password(s.initial_admin_password)))
        db.commit()


def _password(confirm: bool = True) -> str:
    pw = getpass.getpass("Password (min 12 chars): ")
    if len(pw) < MIN_PASSWORD_LENGTH:
        sys.exit(f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")
    if confirm and getpass.getpass("Repeat password: ") != pw:
        sys.exit("Passwords do not match.")
    return pw


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("command", choices=["create-admin", "set-password"])
    p.add_argument("--email", required=True)
    a = p.parse_args()
    email = a.email.lower().strip()
    with SessionLocal() as db:
        user = db.scalar(select(AdminUser).where(AdminUser.email == email))
        if a.command == "create-admin":
            if user:
                sys.exit("That admin already exists. Use set-password to rotate the password.")
            db.add(AdminUser(email=email, password_hash=hash_password(_password())))
        else:
            if not user:
                sys.exit("No such admin.")
            user.password_hash = hash_password(_password())  # invalidates all existing sessions
        db.commit()
    print("Done.")


if __name__ == "__main__":
    main()
