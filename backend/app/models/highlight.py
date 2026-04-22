from datetime import datetime, timezone

from sqlalchemy import String, Integer, Text, DateTime, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class HighlightCandidate(Base):
    __tablename__ = "highlight_candidates"
    __table_args__ = (
        Index("ix_highlights_ep_score", "episode_id", "score"),
        Index("ix_highlights_ep_start", "episode_id", "start_ms"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    episode_id: Mapped[str] = mapped_column(String, ForeignKey("episodes.id"), nullable=False)
    start_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    end_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    rationale_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)
