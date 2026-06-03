from fastapi import APIRouter
import asyncio
import shutil

from app.core.config import settings
from app.core.database import engine
from sqlalchemy import text

router = APIRouter()


@router.get("/health")
async def health_check():
    """Comprehensive health and system status endpoint."""
    checks = {}

    # Database check
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = {"status": "ok", "driver": "sqlite+aiosqlite"}
    except Exception as e:
        checks["database"] = {"status": "error", "message": str(e)}

    # Storage check
    data_path = settings.data_path
    if data_path.exists():
        usage = shutil.disk_usage(str(data_path))
        checks["storage"] = {
            "status": "ok",
            "path": str(data_path),
            "free_gb": round(usage.free / (1024**3), 1),
            "total_gb": round(usage.total / (1024**3), 1),
        }
    else:
        checks["storage"] = {"status": "error", "message": "Data directory not found"}

    # FFmpeg check
    try:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await proc.communicate()
        version_line = stdout.decode("utf-8", errors="replace").split("\n")[0]
        checks["ffmpeg"] = {"status": "ok", "version": version_line.strip()}
    except FileNotFoundError:
        checks["ffmpeg"] = {"status": "error", "message": "ffmpeg not found in PATH"}

    # yt-dlp check
    try:
        proc = await asyncio.create_subprocess_exec(
            "yt-dlp", "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await proc.communicate()
        checks["ytdlp"] = {"status": "ok", "version": stdout.decode().strip()}
    except FileNotFoundError:
        checks["ytdlp"] = {"status": "error", "message": "yt-dlp not found in PATH"}

    all_ok = all(c.get("status") == "ok" for c in checks.values())

    return {
        "success": True,
        "data": {
            "status": "healthy" if all_ok else "degraded",
            "app": settings.app_name,
            "version": settings.app_version,
            "checks": checks,
        },
    }
