"""Transcript pipeline orchestration: fetch, normalize, and store."""

import logging

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.episode import Episode
from app.models.transcript import TranscriptSegment
from app.utils.helpers import generate_id
from app.services.youtube_service import extract_video_id
from app.services.transcript.youtube_transcript_service import (
    fetch_youtube_transcript,
    RawTranscriptEntry,
)
from app.services.transcript.whisper_service import (
    transcribe_with_whisper,
    WhisperSegment,
)

logger = logging.getLogger(__name__)

# Merge short entries into larger segments for readability.
# Target: ~5-15 second chunks with coherent sentence boundaries.
MIN_SEGMENT_DURATION_MS = 3000
MAX_SEGMENT_DURATION_MS = 15000
MAX_SEGMENT_CHARS = 500


async def fetch_and_store_transcript(
    episode: Episode,
    db: AsyncSession,
    force_whisper: bool = False,
) -> int:
    """Run the full transcript pipeline for an episode.

    1. Try YouTube transcript API (fast, free, word-level timestamps)
    2. Fall back to Whisper if YouTube fails or force_whisper is True
    3. Normalize and store segments in DB

    Returns the number of segments stored.
    """
    video_id = extract_video_id(episode.source_url)
    if not video_id:
        raise ValueError(f"Cannot extract video ID from: {episode.source_url}")

    # Clear any existing transcript
    await db.execute(
        delete(TranscriptSegment).where(TranscriptSegment.episode_id == episode.id)
    )

    raw_entries: list[dict] = []

    # Step 1: Try YouTube transcript API
    if not force_whisper:
        try:
            entries = await fetch_youtube_transcript(video_id)
            raw_entries = [
                {
                    "start": e.start,
                    "end": e.start + e.duration,
                    "text": e.text,
                }
                for e in entries
            ]
            logger.info(f"YouTube transcript: {len(raw_entries)} entries for {episode.id}")
        except RuntimeError as e:
            logger.warning(f"YouTube transcript failed for {episode.id}, falling back to Whisper: {e}")

    # Step 2: Fall back to Whisper
    if not raw_entries:
        if not episode.audio_path:
            raise RuntimeError(
                "No YouTube transcript available and no audio file downloaded for Whisper."
            )

        logger.info(f"Using Whisper fallback for {episode.id}")
        segments = await transcribe_with_whisper(episode.audio_path)
        raw_entries = [
            {"start": s.start, "end": s.end, "text": s.text}
            for s in segments
        ]

    # Step 3: Normalize and merge into readable segments
    merged = _merge_entries(raw_entries)

    # Step 4: Store in DB
    for i, seg in enumerate(merged):
        segment = TranscriptSegment(
            id=generate_id("ts"),
            episode_id=episode.id,
            sequence_index=i,
            start_ms=int(seg["start"] * 1000),
            end_ms=int(seg["end"] * 1000),
            text=seg["text"],
            speaker_label=None,
            source_kind="youtube_api" if not force_whisper else "whisper",
        )
        db.add(segment)

    await db.commit()

    # Update episode status
    episode.transcript_status = "transcript_ready"
    await db.commit()

    logger.info(f"Stored {len(merged)} transcript segments for {episode.id}")
    return len(merged)


def _merge_entries(raw: list[dict]) -> list[dict]:
    """Merge short transcript entries into readable segments.

    Combines consecutive short entries into larger chunks of
    ~5-15 seconds, splitting at sentence boundaries when possible.
    """
    if not raw:
        return []

    merged: list[dict] = []
    current_text = ""
    current_start = raw[0]["start"]
    current_end = raw[0]["end"]

    for entry in raw:
        text = entry["text"].strip()
        if not text:
            continue

        candidate_text = (current_text + " " + text).strip()
        candidate_end = entry["end"]
        candidate_duration_ms = (candidate_end - current_start) * 1000

        # Check if we should flush the current segment
        should_flush = (
            candidate_duration_ms > MAX_SEGMENT_DURATION_MS
            or len(candidate_text) > MAX_SEGMENT_CHARS
            # Flush at sentence boundaries if we have enough content
            or (
                candidate_duration_ms > MIN_SEGMENT_DURATION_MS
                and (text.endswith(".") or text.endswith("!") or text.endswith("?"))
            )
        )

        if should_flush and current_text:
            merged.append({
                "start": current_start,
                "end": current_end,
                "text": current_text,
            })
            current_text = text
            current_start = entry["start"]
            current_end = entry["end"]
        else:
            current_text = candidate_text
            current_end = candidate_end

    # Flush remaining
    if current_text:
        merged.append({
            "start": current_start,
            "end": current_end,
            "text": current_text,
        })

    return merged


async def get_transcript_segments(
    episode_id: str,
    db: AsyncSession,
) -> list[TranscriptSegment]:
    """Fetch all transcript segments for an episode, ordered by sequence."""
    result = await db.execute(
        select(TranscriptSegment)
        .where(TranscriptSegment.episode_id == episode_id)
        .order_by(TranscriptSegment.sequence_index)
    )
    return list(result.scalars().all())
