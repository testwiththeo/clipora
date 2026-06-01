import json

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import SuccessResponse
from app.services.subtitle_service import get_subtitle_presets
from app.services.grading_service import BUILTIN_GRADING_PRESETS
from app.models.preset import Preset
from app.utils.helpers import generate_id

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
    """List grading presets (built-in + custom)."""
    presets = [
        {"id": p["id"], "name": p["name"], "config": p["config"], "is_system": True}
        for p in BUILTIN_GRADING_PRESETS
    ]

    # Add custom presets from DB
    result = await db.execute(
        select(Preset).where(Preset.preset_type == "grading")
    )
    db_presets = result.scalars().all()
    for p in db_presets:
        presets.append({
            "id": p.id,
            "name": p.name,
            "config": json.loads(p.config_json),
            "is_system": False,
        })

    return {"success": True, "data": {"presets": presets}}


@router.post("/grading", response_model=SuccessResponse)
async def create_grading_preset(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Create or save a custom grading preset."""
    name = body.get("name")
    config = body.get("config")

    if not name or not config:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": {"code": "INVALID_REQUEST", "message": "name and config are required"},
        })

    # Validate config has required keys
    required_keys = {"brightness", "contrast", "saturation", "temperature"}
    if not required_keys.issubset(config.keys()):
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": {
                "code": "INVALID_CONFIG",
                "message": f"config must contain: {', '.join(required_keys)}",
            },
        })

    preset_id = generate_id("gp")
    preset = Preset(
        id=preset_id,
        preset_type="grading",
        name=name,
        config_json=json.dumps(config),
        is_system=False,
    )

    db.add(preset)
    await db.commit()
    await db.refresh(preset)

    return {
        "success": True,
        "data": {
            "id": preset.id,
            "name": preset.name,
            "config": config,
            "is_system": False,
        },
    }
