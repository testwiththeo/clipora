"""Clip business logic and database operations."""

import json
import logging

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clip import Clip
from app.models.highlight import HighlightCandidate
from app.models.episode import Episode
from app.utils.helpers import generate_id

logger = logging.getLogger(__name__)


async def create_clip(
    db: AsyncSession,
    episode_id: str,
    start_ms: int,
    end_ms: int,
    title: str | None = None,
    candidate_id: str | None = None,
) -> Clip:
    """Create a new clip from timestamps or a highlight candidate."""
    # Validate episode exists
    result = await db.execute(
        select(Episode).where(Episode.id == episode_id)
    )
    episode = result.scalar_one_or_none()
    if not episode:
        raise ValueError(f"Episode not found: {episode_id}")

    # Validate timestamps
    if end_ms <= start_ms:
        raise ValueError("end_ms must be greater than start_ms")
    if start_ms < 0:
        raise ValueError("start_ms cannot be negative")

    # If from candidate, validate it exists
    if candidate_id:
        result = await db.execute(
            select(HighlightCandidate).where(HighlightCandidate.id == candidate_id)
        )
        candidate = result.scalar_one_or_none()
        if not candidate:
            raise ValueError(f"Candidate not found: {candidate_id}")
        if not title:
            title = candidate.title

    clip_id = generate_id("clip")
    clip = Clip(
        id=clip_id,
        episode_id=episode_id,
        candidate_id=candidate_id,
        title=title or f"Clip at {start_ms // 1000}s",
        start_ms=start_ms,
        end_ms=end_ms,
        export_status="draft",
    )

    db.add(clip)
    await db.commit()
    await db.refresh(clip)

    logger.info(f"Clip created: {clip_id} — {clip.title}")
    return clip


async def get_clip(clip_id: str, db: AsyncSession) -> Clip | None:
    """Fetch a single clip by ID."""
    result = await db.execute(
        select(Clip).where(Clip.id == clip_id)
    )
    return result.scalar_one_or_none()


async def update_clip(
    clip_id: str,
    db: AsyncSession,
    start_ms: int | None = None,
    end_ms: int | None = None,
    title: str | None = None,
    subtitle_style: dict | None = None,
    framing: dict | None = None,
    grade: dict | None = None,
) -> Clip | None:
    """Update clip timing or styling settings."""
    result = await db.execute(
        select(Clip).where(Clip.id == clip_id)
    )
    clip = result.scalar_one_or_none()
    if not clip:
        return None

    if start_ms is not None:
        clip.start_ms = start_ms
    if end_ms is not None:
        clip.end_ms = end_ms
    if title is not None:
        clip.title = title

    # Validate timing after update
    if clip.end_ms <= clip.start_ms:
        raise ValueError("end_ms must be greater than start_ms")

    if subtitle_style is not None:
        clip.subtitle_style_json = json.dumps(subtitle_style)
    if framing is not None:
        clip.framing_json = json.dumps(framing)
    if grade is not None:
        clip.grade_json = json.dumps(grade)

    await db.commit()
    await db.refresh(clip)

    logger.info(f"Clip updated: {clip_id}")
    return clip


async def list_clips(
    db: AsyncSession,
    episode_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Clip], int]:
    """List clips with optional episode filter."""
    query = select(Clip)
    count_query = select(func.count()).select_from(Clip)

    if episode_id:
        query = query.where(Clip.episode_id == episode_id)
        count_query = count_query.where(Clip.episode_id == episode_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Clip.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    clips = list(result.scalars().all())

    return clips, total


async def delete_clip(clip_id: str, db: AsyncSession) -> bool:
    """Delete a clip and its render jobs."""
    from app.models.render_job import RenderJob

    result = await db.execute(
        select(Clip).where(Clip.id == clip_id)
    )
    clip = result.scalar_one_or_none()
    if not clip:
        return False

    # Delete render jobs for this clip
    await db.execute(
        delete(RenderJob).where(RenderJob.clip_id == clip_id)
    )
    await db.delete(clip)
    await db.commit()

    logger.info(f"Clip deleted: {clip_id}")
    return True
