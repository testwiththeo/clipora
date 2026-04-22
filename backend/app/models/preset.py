from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Preset(Base):
    __tablename__ = "presets"
    __table_args__ = (Index("ix_presets_type_name", "preset_type", "name"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    preset_type: Mapped[str] = mapped_column(String, nullable=False)  # "export", "subtitle", "grading"
    name: Mapped[str] = mapped_column(String, nullable=False)
    config_json: Mapped[str] = mapped_column(Text, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)
