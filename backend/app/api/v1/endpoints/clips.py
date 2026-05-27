import json

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, async_session
from app.schemas.common import SuccessResponse
from app.schemas.clip import ClipCreate, ClipUpdate, ClipResponse
from app.services.clip_service import (
    create_clip,
    get_clip,
    update_clip,
    list_clips,
    delete_clip,
)
from app.services.render_service import (
    create_preview_render_job,
    process_preview_render,
    create_final_render_job,
    process_final_render,
)

router = APIRouter()


@router.get("", response_model=SuccessResponse)
async def list_clips_endpoint(
    episode_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List clips, optionally filtered by episode."""
    clips, total = await list_clips(
        db, episode_id=episode_id, limit=limit, offset=offset
    )
    return {
        "success": True,
        "data": {
            "clips": [ClipResponse.model_validate(c) for c in clips],
            "total": total,
        },
    }


@router.post("", response_model=SuccessResponse)
async def create_clip_endpoint(
    body: ClipCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a clip from candidate or manual timestamps."""
    try:
        clip = await create_clip(
            db,
            episode_id=body.episode_id,
            start_ms=body.start_ms,
            end_ms=body.end_ms,
            title=body.title,
            candidate_id=body.candidate_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": {"code": "INVALID_REQUEST", "message": str(e)},
        })

    return {
        "success": True,
        "data": ClipResponse.model_validate(clip),
    }


@router.get("/{clip_id}", response_model=SuccessResponse)
async def get_clip_endpoint(
    clip_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Return clip metadata and styling settings."""
    clip = await get_clip(clip_id, db)
    if not clip:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "CLIP_NOT_FOUND", "message": f"Clip {clip_id} not found"},
        })

    return {
        "success": True,
        "data": ClipResponse.model_validate(clip),
    }


@router.patch("/{clip_id}", response_model=SuccessResponse)
async def update_clip_endpoint(
    clip_id: str,
    body: ClipUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update clip timing or styling settings."""
    try:
        clip = await update_clip(
            clip_id,
            db,
            start_ms=body.start_ms,
            end_ms=body.end_ms,
            title=body.title,
            subtitle_style=body.subtitle_style,
            framing=body.framing,
            grade=body.grade,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": {"code": "INVALID_REQUEST", "message": str(e)},
        })

    if not clip:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "CLIP_NOT_FOUND", "message": f"Clip {clip_id} not found"},
        })

    return {
        "success": True,
        "data": ClipResponse.model_validate(clip),
    }


@router.delete("/{clip_id}", response_model=SuccessResponse)
async def delete_clip_endpoint(
    clip_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a clip and its render jobs."""
    deleted = await delete_clip(clip_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "CLIP_NOT_FOUND", "message": f"Clip {clip_id} not found"},
        })

    return {"success": True, "data": None}


@router.post("/{clip_id}/preview-render", response_model=SuccessResponse)
async def preview_render(
    clip_id: str,
    background_tasks: BackgroundTasks,
    body: dict | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Queue a preview render."""
    clip = await get_clip(clip_id, db)
    if not clip:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "CLIP_NOT_FOUND", "message": f"Clip {clip_id} not found"},
        })

    resolution = "720x1280"
    if body and "resolution" in body:
        resolution = body["resolution"]

    job = await create_preview_render_job(clip, db, resolution)

    # Run render in background
    background_tasks.add_task(_process_render_bg, job.id)

    return {
        "success": True,
        "data": {
            "job_id": job.id,
            "status": "queued",
        },
    }


async def _process_render_bg(job_id: str) -> None:
    """Background task wrapper for render processing."""
    async with async_session() as db:
        await process_preview_render(job_id, db)


@router.post("/{clip_id}/final-render", response_model=SuccessResponse)
async def final_render(
    clip_id: str,
    background_tasks: BackgroundTasks,
    body: dict | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Queue final export render."""
    clip = await get_clip(clip_id, db)
    if not clip:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "CLIP_NOT_FOUND", "message": f"Clip {clip_id} not found"},
        })

    export_preset = "youtube_shorts"
    if body and "export_preset" in body:
        export_preset = body["export_preset"]

    try:
        job = await create_final_render_job(clip, db, export_preset)
    except ValueError as e:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": {"code": "INVALID_REQUEST", "message": str(e)},
        })

    background_tasks.add_task(_process_final_render_bg, job.id, export_preset)

    return {
        "success": True,
        "data": {
            "job_id": job.id,
            "status": "queued",
            "export_preset": export_preset,
        },
    }


async def _process_final_render_bg(job_id: str, export_preset: str) -> None:
    """Background task wrapper for final render processing."""
    async with async_session() as db:
        await process_final_render(job_id, db, export_preset)


@router.get("/{clip_id}/download")
async def download_clip(
    clip_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Download the exported clip file."""
    from fastapi.responses import FileResponse

    clip = await get_clip(clip_id, db)
    if not clip or not clip.output_path:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "EXPORT_NOT_FOUND", "message": "No export file available. Run final render first."},
        })

    from pathlib import Path
    file_path = Path(clip.output_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "FILE_NOT_FOUND", "message": "Export file not found on disk."},
        })

    safe_title = (clip.title or clip.id).replace(" ", "_")[:50]
    return FileResponse(
        path=str(file_path),
        filename=f"{safe_title}.mp4",
        media_type="video/mp4",
    )
