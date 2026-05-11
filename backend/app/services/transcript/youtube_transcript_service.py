"""Fetch transcripts from YouTube using youtube-transcript-api."""

import asyncio
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class RawTranscriptEntry:
    """A single raw transcript entry from YouTube."""
    start: float  # seconds
    duration: float  # seconds
    text: str


async def fetch_youtube_transcript(video_id: str) -> list[RawTranscriptEntry]:
    """Fetch transcript from YouTube's transcript API.

    Runs the synchronous youtube-transcript-api in a thread pool.
    Raises RuntimeError if no transcript is available.
    """
    loop = asyncio.get_event_loop()

    def _fetch():
        from youtube_transcript_api import YouTubeTranscriptApi

        try:
            api = YouTubeTranscriptApi()
            transcript = api.fetch(video_id)
        except Exception as e:
            raise RuntimeError(f"YouTube transcript unavailable: {e}")

        return [
            RawTranscriptEntry(
                start=snippet.start,
                duration=snippet.duration,
                text=snippet.text,
            )
            for snippet in transcript
        ]

    entries = await loop.run_in_executor(None, _fetch)
    logger.info(f"Fetched {len(entries)} transcript entries for {video_id}")
    return entries
