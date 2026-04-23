from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ClipBase(BaseModel):
    episode_id: str
    candidate_id: str | None = None
    title: str | None = None
    start_ms: int
    end_ms: int


class ClipCreate(ClipBase):
    pass


class ClipUpdate(BaseModel):
    start_ms: int | None = None
    end_ms: int | None = None
    title: str | None = None
    subtitle_style: dict | None = None
    framing: dict | None = None
    grade: dict | None = None


class ClipResponse(ClipBase):
    id: str
    subtitle_style_json: str | None = None
    framing_json: str | None = None
    grade_json: str | None = None
    preview_path: str | None = None
    output_path: str | None = None
    export_status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
