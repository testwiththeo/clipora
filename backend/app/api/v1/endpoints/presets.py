from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse

router = APIRouter()


@router.get("/export", response_model=SuccessResponse)
async def list_export_presets(
    db: AsyncSession = Depends(get_db),
):
    """List export presets."""
    # TODO: implement lookup
    return {"success": True, "data": {"presets": []}}


@router.get("/subtitles", response_model=SuccessResponse)
async def list_subtitle_presets(
    db: AsyncSession = Depends(get_db),
):
    """List subtitle presets."""
    # TODO: implement lookup
    return {"success": True, "data": {"presets": []}}


@router.get("/grading", response_model=SuccessResponse)
async def list_grading_presets(
    db: AsyncSession = Depends(get_db),
):
    """List grading presets."""
    # TODO: implement lookup
    return {"success": True, "data": {"presets": []}}


@router.post("/grading", response_model=SuccessResponse)
async def create_grading_preset(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Create or save a custom grading preset."""
    # TODO: implement creation
    return {"success": True, "data": None}
