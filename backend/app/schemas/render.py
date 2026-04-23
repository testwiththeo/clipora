from datetime import datetime

from pydantic import BaseModel


class RenderJobResponse(BaseModel):
    id: str
    clip_id: str
    job_type: str
    status: str
    progress: int
    log_path: str | None = None
    output_path: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PreviewRenderRequest(BaseModel):
    resolution: str = "720x1280"


class FinalRenderRequest(BaseModel):
    export_preset: str = "youtube_shorts"
