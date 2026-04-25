from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse

router = APIRouter()


@router.get("", response_model=SuccessResponse)
async def list_render_jobs(
    db: AsyncSession = Depends(get_db),
):
    """List render jobs."""
    # TODO: implement lookup
    return {"success": True, "data": {"jobs": []}}


@router.get("/{job_id}", response_model=SuccessResponse)
async def get_render_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get render job status and output metadata."""
    # TODO: implement lookup
    return {"success": True, "data": None}
