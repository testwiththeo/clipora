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
from app.services.grading_service import parse_clip_grade, build_grading_filter

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
        # Use audio file + color background + subtitle burn-in for preview
        width, height = 720, 1280
        start_s = clip.start_ms / 1000
        duration_s = (clip.end_ms - clip.start_ms) / 1000

        # Build video filter chain: grading → subtitles
        grade = parse_clip_grade(clip.grade_json)
        grading_filter = build_grading_filter(grade)

        vf_filters = []
        if grading_filter:
            vf_filters.append(grading_filter)
        vf_filters.append(f"ass={ass_path}")
        vf_string = ",".join(vf_filters)

        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-ss", f"{start_s:.3f}",
            "-i", episode.audio_path,
            "-f", "lavfi", "-i", f"color=c=#1a1a2e:s={width}x{height}:d={duration_s:.3f}:r=30",
            "-t", f"{duration_s:.3f}",
            "-vf", vf_string,
            "-map", "1:v", "-map", "0:a",
            "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
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


# ── Export presets ──────────────────────────────────────────────

EXPORT_PRESETS: dict[str, dict] = {
    "youtube_shorts": {
        "name": "YouTube Shorts",
        "width": 1080,
        "height": 1920,
        "video_bitrate": "8M",
        "audio_bitrate": "192k",
        "max_duration_s": 60,
        "codec_profile": "high",
        "pix_fmt": "yuv420p",
    },
    "tiktok": {
        "name": "TikTok",
        "width": 1080,
        "height": 1920,
        "video_bitrate": "6M",
        "audio_bitrate": "192k",
        "max_duration_s": 180,
        "codec_profile": "high",
        "pix_fmt": "yuv420p",
    },
    "instagram_reels": {
        "name": "Instagram Reels",
        "width": 1080,
        "height": 1920,
        "video_bitrate": "8M",
        "audio_bitrate": "192k",
        "max_duration_s": 90,
        "codec_profile": "high",
        "pix_fmt": "yuv420p",
    },
}


async def create_final_render_job(
    clip: Clip,
    db: AsyncSession,
    export_preset: str = "youtube_shorts",
) -> RenderJob:
    """Create a final export render job for a clip."""
    if export_preset not in EXPORT_PRESETS:
        raise ValueError(f"Unknown export preset: {export_preset}")

    preset = EXPORT_PRESETS[export_preset]
    duration_s = (clip.end_ms - clip.start_ms) / 1000
    if duration_s > preset["max_duration_s"]:
        raise ValueError(
            f"Clip duration ({duration_s:.0f}s) exceeds {preset['name']} "
            f"limit ({preset['max_duration_s']}s)"
        )

    job_id = generate_id("job")
    job = RenderJob(
        id=job_id,
        clip_id=clip.id,
        job_type="final",
        status="queued",
        progress=0,
    )

    db.add(job)
    await db.commit()
    await db.refresh(job)

    logger.info(f"Final render job created: {job_id} for clip {clip.id} ({export_preset})")
    return job


async def process_final_render(job_id: str, db: AsyncSession, export_preset: str) -> None:
    """Execute the final export render pipeline.

    Higher quality than preview: full resolution, better bitrate, proper codec profile.
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

        preset = EXPORT_PRESETS[export_preset]

        # Set up output directory
        episode_dir = settings.episodes_path / clip.episode_id / "exports"
        episode_dir.mkdir(parents=True, exist_ok=True)
        safe_preset = export_preset.replace("/", "_")
        output_path = str(episode_dir / f"{clip.id}_{safe_preset}.mp4")
        ass_path = str(episode_dir / f"{clip.id}_{safe_preset}.ass")

        # Load transcript segments
        seg_result = await db.execute(
            select(TranscriptSegment)
            .where(TranscriptSegment.episode_id == clip.episode_id)
            .order_by(TranscriptSegment.sequence_index)
        )
        segments = list(seg_result.scalars().all())

        job.progress = 20
        await db.commit()

        # Generate ASS subtitles (at export resolution)
        subtitle_config = get_preset_config(None)
        if clip.subtitle_style_json:
            try:
                style_data = json.loads(clip.subtitle_style_json)
                preset_id = style_data.get("preset")
                if preset_id:
                    subtitle_config = get_preset_config(preset_id)
                for key, val in style_data.items():
                    if key != "preset" and key in subtitle_config:
                        subtitle_config[key] = val
            except (json.JSONDecodeError, TypeError):
                pass

        ass_content = generate_ass_subtitles(
            segments, subtitle_config, clip.start_ms, clip.end_ms,
            output_width=preset["width"], output_height=preset["height"],
        )
        write_ass_file(ass_content, ass_path)

        job.progress = 35
        await db.commit()

        # Build high-quality FFmpeg command
        width = preset["width"]
        height = preset["height"]
        start_s = clip.start_ms / 1000
        duration_s = (clip.end_ms - clip.start_ms) / 1000

        # Build video filter chain: grading → subtitles
        grade = parse_clip_grade(clip.grade_json)
        grading_filter = build_grading_filter(grade)

        vf_filters = []
        if grading_filter:
            vf_filters.append(grading_filter)
        vf_filters.append(f"ass={ass_path}")
        vf_string = ",".join(vf_filters)

        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-ss", f"{start_s:.3f}",
            "-i", episode.audio_path,
            "-f", "lavfi", "-i", f"color=c=#0a0a0a:s={width}x{height}:d={duration_s:.3f}:r=30",
            "-t", f"{duration_s:.3f}",
            "-vf", vf_string,
            "-map", "1:v", "-map", "0:a",
            "-c:v", "libx264",
            "-profile:v", preset["codec_profile"],
            "-pix_fmt", preset["pix_fmt"],
            "-b:v", preset["video_bitrate"],
            "-maxrate", preset["video_bitrate"],
            "-bufsize", str(int(preset["video_bitrate"].replace("M", "")) * 2) + "M",
            "-preset", "medium",
            "-c:a", "aac",
            "-b:a", preset["audio_bitrate"],
            "-movflags", "+faststart",
            "-shortest",
            output_path,
        ]

        logger.info(f"Running final FFmpeg render for job {job_id} ({export_preset})")

        process = await asyncio.create_subprocess_exec(
            *ffmpeg_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        job.progress = 55
        await db.commit()

        _, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode("utf-8", errors="replace")
            logger.error(f"Final FFmpeg failed for job {job_id}: {error_msg[-500:]}")
            raise RuntimeError(f"FFmpeg export failed: {error_msg[-200:]}")

        job.progress = 90
        await db.commit()

        # Mark job complete
        job.status = "completed"
        job.progress = 100
        job.output_path = output_path

        # Update clip
        clip.output_path = output_path
        clip.export_status = "exported"
        await db.commit()

        logger.info(f"Final export complete: {output_path}")

    except Exception as e:
        logger.error(f"Final render job {job_id} failed: {e}")
        job.status = "failed"
        job.error_message = str(e)
        await db.commit()
