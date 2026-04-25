"""Episode business logic and database operations."""

import logging
import shutil
from pathlib import Path

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.episode import Episode
from app.models.transcript import TranscriptSegment
from app.models.highlight import HighlightCandidate
from app.models.clip import Clip
from app.models.render_job import RenderJob
from app.utils.helpers import generate_id
from app.services.youtube_service import (
    fetch_metadata,
    download_audio,
    extract_video_id,
)

logger = logging.getLogger(__name__)


async def create_episode_from_youtube(url: str, db: AsyncSession) -> Episode:
    """Create an episode record from a YouTube URL.

    Fetches metadata via yt-dlp and stores the episode in the database.
    """
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError(f"Invalid YouTube URL: {url}")

    # Check for duplicate
    existing = await db.execute(
        select(Episode).where(Episode.source_url == url)
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"Episode already imported: {url}")

    # Fetch metadata
    metadata = await fetch_metadata(url)

    # Create episode record
    episode_id = generate_id("ep")
    episode_dir = settings.episodes_path / episode_id
    episode_dir.mkdir(parents=True, exist_ok=True)

    episode = Episode(
        id=episode_id,
        source_type="youtube",
        source_url=url,
        title=metadata.title,
        channel_name=metadata.channel_name,
        description=metadata.description[:2000] if metadata.description else None,
        duration_seconds=metadata.duration_seconds,
        thumbnail_url=metadata.thumbnail_url,
        transcript_status="pending",
        analysis_status="pending",
    )

    db.add(episode)
    await db.commit()
    await db.refresh(episode)

    logger.info(f"Episode created: {episode_id} — {metadata.title}")
    return episode


async def process_episode_import(episode_id: str, db: AsyncSession) -> None:
    """Background task: download audio and fetch transcript."""
    result = await db.execute(
        select(Episode).where(Episode.id == episode_id)
    )
    episode = result.scalar_one_or_none()
    if not episode:
        logger.error(f"Episode not found: {episode_id}")
        return

    try:
        episode_dir = settings.episodes_path / episode_id

        # Download audio
        source_dir = str(episode_dir / "source")
        Path(source_dir).mkdir(parents=True, exist_ok=True)

        audio_path = await download_audio(episode.source_url, source_dir)

        # Update episode with audio path
        episode.audio_path = audio_path
        episode.local_media_path = source_dir
        episode.transcript_status = "importing"
        await db.commit()

        # Fetch transcript (YouTube API first, Whisper fallback)
        from app.services.transcript.transcript_service import fetch_and_store_transcript

        try:
            count = await fetch_and_store_transcript(episode, db)
            logger.info(f"Episode {episode_id} transcript ready: {count} segments")
        except Exception as transcript_err:
            logger.warning(
                f"Transcript fetch failed for {episode_id}: {transcript_err}. "
                "Episode imported but transcript is unavailable."
            )
            episode.transcript_status = "failed"
            episode.error_message = f"Transcript unavailable: {transcript_err}"
            await db.commit()

        logger.info(f"Episode {episode_id} import complete")

    except Exception as e:
        logger.error(f"Episode {episode_id} import failed: {e}")
        episode.error_message = str(e)
        episode.transcript_status = "failed"
        await db.commit()


async def list_episodes(
    db: AsyncSession,
    status: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Episode], int]:
    """List episodes with optional filtering and pagination."""
    query = select(Episode)
    count_query = select(func.count()).select_from(Episode)

    if status:
        query = query.where(Episode.transcript_status == status)
        count_query = count_query.where(Episode.transcript_status == status)

    if search:
        search_filter = (
            Episode.title.ilike(f"%{search}%")
            | Episode.channel_name.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated results
    query = query.order_by(Episode.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    episodes = list(result.scalars().all())

    return episodes, total


async def get_episode(episode_id: str, db: AsyncSession) -> Episode | None:
    """Fetch a single episode by ID."""
    result = await db.execute(
        select(Episode).where(Episode.id == episode_id)
    )
    return result.scalar_one_or_none()


async def delete_episode(episode_id: str, db: AsyncSession) -> bool:
    """Delete an episode and its related data + local files."""
    result = await db.execute(
        select(Episode).where(Episode.id == episode_id)
    )
    episode = result.scalar_one_or_none()
    if not episode:
        return False

    # Delete related records
    await db.execute(delete(RenderJob).where(
        RenderJob.clip_id.in_(
            select(Clip.id).where(Clip.episode_id == episode_id)
        )
    ))
    await db.execute(delete(Clip).where(Clip.episode_id == episode_id))
    await db.execute(delete(HighlightCandidate).where(HighlightCandidate.episode_id == episode_id))
    await db.execute(delete(TranscriptSegment).where(TranscriptSegment.episode_id == episode_id))
    await db.delete(episode)
    await db.commit()

    # Remove local files
    episode_dir = settings.episodes_path / episode_id
    if episode_dir.exists():
        shutil.rmtree(episode_dir, ignore_errors=True)

    logger.info(f"Episode deleted: {episode_id}")
    return True
