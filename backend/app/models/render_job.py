from datetime import datetime, timezone

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RenderJob(Base):
    __tablename__ = "render_jobs"
    __table_args__ = (
        Index("ix_render_clip_created", "clip_id", "created_at"),
        Index("ix_render_status_created", "status", "created_at"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    clip_id: Mapped[str] = mapped_column(String, ForeignKey("clips.id"), nullable=False)
    job_type: Mapped[str] = mapped_column(String, nullable=False)  # "preview" or "final"
    status: Mapped[str] = mapped_column(String, nullable=False, default="queued")
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    log_path: Mapped[str | None] = mapped_column(String, nullable=True)
    output_path: Mapped[str | None] = mapped_column(String, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)
