import json

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse
from app.services.subtitle_service import get_subtitle_presets

router = APIRouter()


@router.get("/export", response_model=SuccessResponse)
async def list_export_presets(
    db: AsyncSession = Depends(get_db),
):
    """List export presets."""
    # Built-in export presets
    presets = [
        {
            "id": "youtube_shorts",
            "name": "YouTube Shorts",
            "resolution": "1080x1920",
            "aspect_ratio": "9:16",
            "max_duration_s": 60,
            "codec": "h264",
        },
        {
            "id": "tiktok",
            "name": "TikTok",
            "resolution": "1080x1920",
            "aspect_ratio": "9:16",
            "max_duration_s": 180,
            "codec": "h264",
        },
        {
            "id": "instagram_reels",
            "name": "Instagram Reels",
            "resolution": "1080x1920",
            "aspect_ratio": "9:16",
            "max_duration_s": 90,
            "codec": "h264",
        },
    ]

    return {"success": True, "data": {"presets": presets}}


@router.get("/subtitles", response_model=SuccessResponse)
async def list_subtitle_presets(
    db: AsyncSession = Depends(get_db),
):
    """List subtitle presets."""
    presets = await get_subtitle_presets(db)
    return {"success": True, "data": {"presets": presets}}


@router.get("/grading", response_model=SuccessResponse)
async def list_grading_presets(
    db: AsyncSession = Depends(get_db),
):
    """List grading presets."""
    # Built-in grading presets
    presets = [
        {
            "id": "none",
            "name": "None (Original)",
            "config": {"brightness": 0, "contrast": 1, "saturation": 1, "temperature": 0},
        },
        {
            "id": "podcast_studio",
            "name": "Podcast Studio",
            "config": {"brightness": 0.03, "contrast": 1.08, "saturation": 1.06, "temperature": 0.02},
        },
        {
            "id": "warm_vintage",
            "name": "Warm Vintage",
            "config": {"brightness": 0.02, "contrast": 1.05, "saturation": 0.9, "temperature": 0.08},
        },
        {
            "id": "cool_modern",
            "name": "Cool Modern",
            "config": {"brightness": 0.01, "contrast": 1.1, "saturation": 0.95, "temperature": -0.05},
        },
    ]

    return {"success": True, "data": {"presets": presets}}


@router.post("/grading", response_model=SuccessResponse)
async def create_grading_preset(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Create or save a custom grading preset."""
    # TODO: implement custom grading preset creation
    return {"success": True, "data": None}
