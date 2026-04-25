from fastapi import APIRouter

from app.api.v1.endpoints import health, episodes, transcripts, clips, renders, presets

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(episodes.router, prefix="/episodes", tags=["episodes"])
api_router.include_router(transcripts.router, prefix="/episodes", tags=["transcripts"])
api_router.include_router(clips.router, prefix="/clips", tags=["clips"])
api_router.include_router(renders.router, prefix="/render-jobs", tags=["renders"])
api_router.include_router(presets.router, prefix="/presets", tags=["presets"])
