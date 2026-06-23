from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    produce_name: Mapped[str] = mapped_column(String(80))
    produce_type: Mapped[str] = mapped_column(String(40))
    score: Mapped[int] = mapped_column(Integer)
    band: Mapped[str] = mapped_column(String(16))
    confidence: Mapped[int] = mapped_column(Integer)
    flagged: Mapped[str | None] = mapped_column(String(160), nullable=True)
    verdict: Mapped[str] = mapped_column(String(400))
    days_counter: Mapped[int] = mapped_column(Integer)
    days_fridge: Mapped[int] = mapped_column(Integer)
    image_path: Mapped[str] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)


class PantryItem(Base):
    __tablename__ = "pantry_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    scan_id: Mapped[int | None] = mapped_column(ForeignKey("scans.id"), nullable=True)

    name: Mapped[str] = mapped_column(String(80))
    produce_type: Mapped[str] = mapped_column(String(40))
    score: Mapped[int] = mapped_column(Integer)
    band: Mapped[str] = mapped_column(String(16))
    days_counter: Mapped[int] = mapped_column(Integer)
    days_fridge: Mapped[int] = mapped_column(Integer)
    storage: Mapped[str] = mapped_column(String(16), default="fridge")
    status: Mapped[str] = mapped_column(String(16), default="active")
    image_path: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class TraderBatch(Base):
    __tablename__ = "trader_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    item_count: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)

    items: Mapped[list["TraderBatchItem"]] = relationship(
        back_populates="batch", cascade="all, delete-orphan"
    )


class TraderBatchItem(Base):
    __tablename__ = "trader_batch_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("trader_batches.id"), index=True)

    produce_name: Mapped[str] = mapped_column(String(80))
    produce_type: Mapped[str] = mapped_column(String(40))
    score: Mapped[int] = mapped_column(Integer)
    band: Mapped[str] = mapped_column(String(16))
    confidence: Mapped[int] = mapped_column(Integer)

    batch: Mapped[TraderBatch] = relationship(back_populates="items")
