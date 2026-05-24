"""FFmpeg-based preview and final rendering pipeline."""

import asyncio
import json
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.clip import Clip
from app.models.episode import Episode
from app.models.transcript import TranscriptSegment
from app.models.render_job import RenderJob
from app.utils.helpers import generate_id
from app.services.subtitle_service import (
    get_preset_config,
    generate_ass_subtitles,
    write_ass_file,
)

logger = logging.getLogger(__name__)


async def create_preview_render_job(
    clip: Clip,
    db: AsyncSession,
    resolution: str = "720x1280",
) -> RenderJob:
    """Create a preview render job for a clip."""
    job_id = generate_id("job")

    job = RenderJob(
        id=job_id,
        clip_id=clip.id,
        job_type="preview",
        status="queued",
        progress=0,
    )

    db.add(job)
    await db.commit()
    await db.refresh(job)

    logger.info(f"Preview render job created: {job_id} for clip {clip.id}")
    return job


async def process_preview_render(job_id: str, db: AsyncSession) -> None:
    """Execute the preview render pipeline.

    Steps:
    1. Load clip, episode, and transcript data
    2. Generate ASS subtitle file
    3. Run FFmpeg to cut, scale, and burn subtitles
    4. Update job status and output path
    """
    result = await db.execute(
        select(RenderJob).where(RenderJob.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        logger.error(f"Render job not found: {job_id}")
        return

    try:
        job.status = "processing"
        job.progress = 10
        await db.commit()

        # Load clip and episode
        clip_result = await db.execute(
            select(Clip).where(Clip.id == job.clip_id)
        )
        clip = clip_result.scalar_one_or_none()
        if not clip:
            raise RuntimeError(f"Clip not found: {job.clip_id}")

        ep_result = await db.execute(
            select(Episode).where(Episode.id == clip.episode_id)
        )
        episode = ep_result.scalar_one_or_none()
        if not episode or not episode.audio_path:
            raise RuntimeError("Episode or audio file not available")

        # Set up output directory
        episode_dir = settings.episodes_path / clip.episode_id / "previews"
        episode_dir.mkdir(parents=True, exist_ok=True)
        output_path = str(episode_dir / f"{clip.id}_preview.mp4")
        ass_path = str(episode_dir / f"{clip.id}_subtitles.ass")

        # Load transcript segments for subtitle generation
        seg_result = await db.execute(
            select(TranscriptSegment)
            .where(TranscriptSegment.episode_id == clip.episode_id)
            .order_by(TranscriptSegment.sequence_index)
        )
        segments = list(seg_result.scalars().all())

        job.progress = 20
        await db.commit()

        # Generate ASS subtitles
        subtitle_config = get_preset_config(
            clip.subtitle_style_json
            if clip.subtitle_style_json
            else None
        )

        # Parse subtitle style from clip if it has a preset reference
        if clip.subtitle_style_json:
            try:
                style_data = json.loads(clip.subtitle_style_json)
                preset_id = style_data.get("preset")
                if preset_id:
                    subtitle_config = get_preset_config(preset_id)
                # Merge any custom overrides
                for key, val in style_data.items():
                    if key != "preset" and key in subtitle_config:
                        subtitle_config[key] = val
            except (json.JSONDecodeError, TypeError):
                pass

        ass_content = generate_ass_subtitles(
            segments, subtitle_config, clip.start_ms, clip.end_ms
        )
        write_ass_file(ass_content, ass_path)

        job.progress = 40
        await db.commit()

        # Build FFmpeg command
        # Use audio file + subtitle burn-in for preview
        width, height = 720, 1280

        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", episode.audio_path,
            "-ss", f"{clip.start_ms / 1000:.3f}",
            "-t", f"{(clip.end_ms - clip.start_ms) / 1000:.3f}",
            "-f", "lavfi", "-i", f"color=c=#111113:s={width}x{height}:d={(clip.end_ms - clip.start_ms) / 1000:.3f}",
            "-vf", f"ass={ass_path}",
            "-map", "1:v", "-map", "0:a",
            "-c:v", "libx264", "-preset", "fast",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest",
            output_path,
        ]

        logger.info(f"Running FFmpeg for job {job_id}")

        process = await asyncio.create_subprocess_exec(
            *ffmpeg_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        job.progress = 60
        await db.commit()

        _, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode("utf-8", errors="replace")
            # Log last 500 chars of error
            logger.error(f"FFmpeg failed for job {job_id}: {error_msg[-500:]}")
            raise RuntimeError(f"FFmpeg render failed: {error_msg[-200:]}")

        job.progress = 90
        await db.commit()

        # Update job as completed
        job.status = "completed"
        job.progress = 100
        job.output_path = output_path

        # Update clip preview path
        clip.preview_path = output_path
        await db.commit()

        logger.info(f"Preview render complete: {output_path}")

    except Exception as e:
        logger.error(f"Render job {job_id} failed: {e}")
        job.status = "failed"
        job.error_message = str(e)
        await db.commit()


async def get_render_jobs(
    db: AsyncSession,
    clip_id: str | None = None,
) -> list[RenderJob]:
    """List render jobs, optionally filtered by clip."""
    query = select(RenderJob).order_by(RenderJob.created_at.desc())
    if clip_id:
        query = query.where(RenderJob.clip_id == clip_id)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_render_job(job_id: str, db: AsyncSession) -> RenderJob | None:
    """Fetch a single render job by ID."""
    result = await db.execute(
        select(RenderJob).where(RenderJob.id == job_id)
    )
    return result.scalar_one_or_none()
