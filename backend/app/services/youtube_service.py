"""YouTube metadata extraction using yt-dlp."""

import asyncio
import logging
import re
from dataclasses import dataclass

logger = logging.getLogger(__name__)

YOUTUBE_URL_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})"
)


@dataclass
class YouTubeMetadata:
    video_id: str
    title: str
    channel_name: str | None
    description: str | None
    duration_seconds: int | None
    thumbnail_url: str | None


def extract_video_id(url: str) -> str | None:
    """Extract YouTube video ID from URL."""
    match = YOUTUBE_URL_PATTERN.search(url)
    return match.group(1) if match else None


def validate_youtube_url(url: str) -> bool:
    """Check if URL is a valid YouTube video URL."""
    return extract_video_id(url) is not None


async def fetch_metadata(url: str) -> YouTubeMetadata:
    """Fetch video metadata from YouTube using yt-dlp.

    Runs yt-dlp as a subprocess to extract metadata without downloading.
    """
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError(f"Invalid YouTube URL: {url}")

    cmd = [
        "yt-dlp",
        "--dump-json",
        "--no-download",
        "--no-warnings",
        "--quiet",
        url,
    ]

    logger.info(f"Fetching metadata for {url}")

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout, stderr = await process.communicate()

    if process.returncode != 0:
        error_msg = stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"yt-dlp metadata extraction failed: {error_msg}")

    import json

    info = json.loads(stdout.decode("utf-8"))

    # Pick best thumbnail
    thumbnail = info.get("thumbnail")
    if not thumbnail and info.get("thumbnails"):
        thumbnails = info["thumbnails"]
        # Pick the largest thumbnail
        best = max(thumbnails, key=lambda t: t.get("width", 0) * t.get("height", 0), default=None)
        if best:
            thumbnail = best.get("url")

    return YouTubeMetadata(
        video_id=video_id,
        title=info.get("title", f"Untitled ({video_id})"),
        channel_name=info.get("channel") or info.get("uploader"),
        description=info.get("description"),
        duration_seconds=info.get("duration"),
        thumbnail_url=thumbnail,
    )


async def download_audio(url: str, output_dir: str) -> str:
    """Download audio track from YouTube video.

    Returns path to the downloaded audio file.
    """
    cmd = [
        "yt-dlp",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--no-warnings",
        "--quiet",
        "-o", f"{output_dir}/%(id)s.%(ext)s",
        url,
    ]

    logger.info(f"Downloading audio for {url} to {output_dir}")

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout, stderr = await process.communicate()

    if process.returncode != 0:
        error_msg = stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"yt-dlp audio download failed: {error_msg}")

    video_id = extract_video_id(url)
    audio_path = f"{output_dir}/{video_id}.mp3"
    logger.info(f"Audio downloaded: {audio_path}")
    return audio_path
