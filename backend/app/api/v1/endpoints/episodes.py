from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, async_session
from app.schemas.common import SuccessResponse
from app.schemas.episode import YouTubeImportRequest, EpisodeResponse, EpisodeListResponse
from app.services.episode_service import (
    create_episode_from_youtube,
    process_episode_import,
    list_episodes,
    get_episode,
    delete_episode,
)
from app.services.youtube_service import validate_youtube_url

router = APIRouter()


@router.get("", response_model=SuccessResponse)
async def list_episodes_endpoint(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List episodes with optional filters."""
    episodes, total = await list_episodes(
        db, status=status, search=search, limit=limit, offset=offset
    )
    return {
        "success": True,
        "data": {
            "episodes": [EpisodeResponse.model_validate(ep) for ep in episodes],
            "total": total,
        },
    }


@router.post("/import/youtube", response_model=SuccessResponse)
async def import_youtube_episode(
    body: YouTubeImportRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Create an episode from a YouTube URL and start import."""
    if not validate_youtube_url(body.url):
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": {"code": "INVALID_URL", "message": "Not a valid YouTube URL"},
        })

    try:
        episode = await create_episode_from_youtube(body.url, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": {"code": "IMPORT_FAILED", "message": str(e)},
        })
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail={
            "success": False,
            "error": {"code": "METADATA_FETCH_FAILED", "message": str(e)},
        })

    # Schedule background audio download
    background_tasks.add_task(_process_import_bg, episode.id)

    return {
        "success": True,
        "data": {
            "episode": EpisodeResponse.model_validate(episode),
            "status": "importing",
        },
    }


async def _process_import_bg(episode_id: str) -> None:
    """Background task wrapper that creates its own DB session."""
    async with async_session() as db:
        await process_episode_import(episode_id, db)


@router.get("/{episode_id}", response_model=SuccessResponse)
async def get_episode_endpoint(
    episode_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Return full episode metadata."""
    episode = await get_episode(episode_id, db)
    if not episode:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "EPISODE_NOT_FOUND", "message": f"Episode {episode_id} not found"},
        })

    return {
        "success": True,
        "data": EpisodeResponse.model_validate(episode),
    }


@router.delete("/{episode_id}", response_model=SuccessResponse)
async def delete_episode_endpoint(
    episode_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete episode metadata and related local assets."""
    deleted = await delete_episode(episode_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "EPISODE_NOT_FOUND", "message": f"Episode {episode_id} not found"},
        })

    return {"success": True, "data": None}


@router.post("/{episode_id}/analyze", response_model=SuccessResponse)
async def analyze_episode(
    episode_id: str,
    body: dict | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Run segmentation and highlight scoring."""
    episode = await get_episode(episode_id, db)
    if not episode:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "EPISODE_NOT_FOUND", "message": f"Episode {episode_id} not found"},
        })

    # TODO: implement analysis pipeline
    return {"success": True, "data": {"status": "queued"}}


@router.get("/{episode_id}/highlights", response_model=SuccessResponse)
async def get_highlights(
    episode_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get ranked candidate highlight windows."""
    # TODO: implement lookup
    return {"success": True, "data": {"highlights": []}}
