import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DB_PATH = Path(os.environ.get("FRESCO_DB_PATH", Path(__file__).resolve().parent.parent / "fresco.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Models use plain SQLAlchemy types only (no SQLite-specific features) so the
# same schema works unchanged against Postgres once a real Supabase project
# is wired up — only DATABASE_URL needs to change.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
