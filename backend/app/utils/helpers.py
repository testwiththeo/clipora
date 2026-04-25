"""Utility helpers for the Clipora backend."""

import uuid
from datetime import datetime, timezone


def generate_id(prefix: str) -> str:
    """Generate a prefixed unique ID (e.g. ep_abc123)."""
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def format_duration(seconds: int) -> str:
    """Format seconds into HH:MM:SS."""
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"
