from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse
from app.services.render_service import get_render_jobs, get_render_job

router = APIRouter()


@router.get("", response_model=SuccessResponse)
async def list_render_jobs_endpoint(
    clip_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List render jobs, optionally filtered by clip."""
    jobs = await get_render_jobs(db, clip_id=clip_id)
    return {
        "success": True,
        "data": {
            "jobs": [
                {
                    "id": j.id,
                    "clip_id": j.clip_id,
                    "job_type": j.job_type,
                    "status": j.status,
                    "progress": j.progress,
                    "output_path": j.output_path,
                    "error_message": j.error_message,
                    "created_at": j.created_at.isoformat() if j.created_at else None,
                }
                for j in jobs
            ],
        },
    }


@router.get("/{job_id}", response_model=SuccessResponse)
async def get_render_job_endpoint(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get render job status and output metadata."""
    job = await get_render_job(job_id, db)
    if not job:
        raise HTTPException(status_code=404, detail={
            "success": False,
            "error": {"code": "JOB_NOT_FOUND", "message": f"Render job {job_id} not found"},
        })

    return {
        "success": True,
        "data": {
            "id": job.id,
            "clip_id": job.clip_id,
            "job_type": job.job_type,
            "status": job.status,
            "progress": job.progress,
            "output_path": job.output_path,
            "error_message": job.error_message,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        },
    }
