from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, async_session
from app.schemas.common import SuccessResponse
from app.services.episode_service import get_episode
from app.services.transcript.transcript_service import (
    fetch_and_store_transcript,
    get_transcript_segments,
)

router = APIRouter()


@router.get("/{episode_id}/transcript", response_model=SuccessResponse)
async def get_transcript(
    episode_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Returns transcript segments for an episode."""
    episode = await get_episode(episode_id, db)
    if not episode:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "EPISODE_NOT_FOUND", "message": f"Episode {episode_id} not found"},
        })

    segments = await get_transcript_segments(episode_id, db)

    return {
        "success": True,
        "data": {
            "segments": [
                {
                    "id": seg.id,
                    "sequence_index": seg.sequence_index,
                    "start_ms": seg.start_ms,
                    "end_ms": seg.end_ms,
                    "text": seg.text,
                    "speaker_label": seg.speaker_label,
                    "source_kind": seg.source_kind,
                }
                for seg in segments
            ],
            "total": len(segments),
        },
    }


@router.post("/{episode_id}/transcript/rebuild", response_model=SuccessResponse)
async def rebuild_transcript(
    episode_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Re-run transcript fetch and normalization."""
    episode = await get_episode(episode_id, db)
    if not episode:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "EPISODE_NOT_FOUND", "message": f"Episode {episode_id} not found"},
        })

    episode.transcript_status = "importing"
    await db.commit()

    background_tasks.add_task(_rebuild_transcript_bg, episode_id)

    return {"success": True, "data": {"status": "queued"}}


@router.post("/{episode_id}/transcript/whisper", response_model=SuccessResponse)
async def whisper_transcription(
    episode_id: str,
    body: dict | None = None,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
):
    """Force Whisper transcription path."""
    episode = await get_episode(episode_id, db)
    if not episode:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "EPISODE_NOT_FOUND", "message": f"Episode {episode_id} not found"},
        })

    if not episode.audio_path:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": {
                "code": "AUDIO_NOT_AVAILABLE",
                "message": "Audio file has not been downloaded yet. Wait for import to complete.",
            },
        })

    episode.transcript_status = "importing"
    await db.commit()

    background_tasks.add_task(_whisper_transcript_bg, episode_id)

    return {"success": True, "data": {"status": "queued"}}


async def _rebuild_transcript_bg(episode_id: str) -> None:
    """Background task: re-fetch transcript from YouTube API."""
    async with async_session() as db:
        episode = await get_episode(episode_id, db)
        if not episode:
            return
        try:
            await fetch_and_store_transcript(episode, db)
        except Exception as e:
            logger_error(f"Transcript rebuild failed for {episode_id}: {e}")
            episode.transcript_status = "failed"
            episode.error_message = str(e)
            await db.commit()


async def _whisper_transcript_bg(episode_id: str) -> None:
    """Background task: force Whisper transcription."""
    async with async_session() as db:
        episode = await get_episode(episode_id, db)
        if not episode:
            return
        try:
            await fetch_and_store_transcript(episode, db, force_whisper=True)
        except Exception as e:
            logger_error(f"Whisper transcription failed for {episode_id}: {e}")
            episode.transcript_status = "failed"
            episode.error_message = str(e)
            await db.commit()


def logger_error(msg: str) -> None:
    import logging
    logging.getLogger(__name__).error(msg)
