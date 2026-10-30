from alembic import context
from sqlalchemy import create_engine

from app.core.config import get_settings
from app.db import Base
import app.models  # noqa: F401

url = get_settings().sqlalchemy_url
target = Base.metadata


def run() -> None:
    if context.is_offline_mode():
        context.configure(url=url, target_metadata=target, literal_binds=True)
        with context.begin_transaction():
            context.run_migrations()
        return
    engine = create_engine(url)
    with engine.connect() as conn:
        context.configure(connection=conn, target_metadata=target, render_as_batch=url.startswith("sqlite"))
        with context.begin_transaction():
            context.run_migrations()


run()
