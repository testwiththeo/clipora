from datetime import datetime, timezone

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Clip(Base):
    __tablename__ = "clips"
    __table_args__ = (
        Index("ix_clips_ep_created", "episode_id", "created_at"),
        Index("ix_clips_candidate", "candidate_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    episode_id: Mapped[str] = mapped_column(String, ForeignKey("episodes.id"), nullable=False)
    candidate_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("highlight_candidates.id"), nullable=True
    )
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    start_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    end_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    subtitle_style_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    framing_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    grade_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    preview_path: Mapped[str | None] = mapped_column(String, nullable=True)
    output_path: Mapped[str | None] = mapped_column(String, nullable=True)
    export_status: Mapped[str] = mapped_column(String, nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)
