from datetime import datetime
from typing import Any

from pydantic import BaseModel


class EpisodeBase(BaseModel):
    title: str
    source_type: str
    source_url: str | None = None
    channel_name: str | None = None
    description: str | None = None
    duration_seconds: int | None = None
    thumbnail_url: str | None = None


class EpisodeCreate(EpisodeBase):
    pass


class EpisodeResponse(EpisodeBase):
    id: str
    transcript_status: str
    analysis_status: str
    error_message: str | None = None
    local_media_path: str | None = None
    audio_path: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EpisodeListResponse(BaseModel):
    episodes: list[EpisodeResponse]
    total: int


class YouTubeImportRequest(BaseModel):
    url: str
