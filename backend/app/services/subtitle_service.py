"""Subtitle presets and ASS subtitle file generation."""

import json
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.preset import Preset
from app.models.transcript import TranscriptSegment
from app.utils.helpers import generate_id

logger = logging.getLogger(__name__)

# Built-in subtitle style presets
BUILTIN_SUBTITLE_PRESETS = [
    {
        "id": "preset_sub_bold_clean",
        "name": "Bold & Clean",
        "preset_type": "subtitle",
        "is_system": True,
        "config": {
            "font_name": "Arial",
            "font_size": 22,
            "bold": True,
            "italic": False,
            "primary_color": "#FFFFFF",
            "outline_color": "#000000",
            "outline_width": 2,
            "shadow_offset": 1,
            "alignment": "bottom_center",
            "margin_bottom": 40,
            "highlight_words": False,
        },
    },
    {
        "id": "preset_sub_modern_pop",
        "name": "Modern Pop",
        "preset_type": "subtitle",
        "is_system": True,
        "config": {
            "font_name": "Arial Black",
            "font_size": 26,
            "bold": True,
            "italic": False,
            "primary_color": "#FFFF00",
            "outline_color": "#000000",
            "outline_width": 3,
            "shadow_offset": 2,
            "alignment": "bottom_center",
            "margin_bottom": 50,
            "highlight_words": True,
        },
    },
    {
        "id": "preset_sub_minimal",
        "name": "Minimal",
        "preset_type": "subtitle",
        "is_system": True,
        "config": {
            "font_name": "Helvetica",
            "font_size": 18,
            "bold": False,
            "italic": False,
            "primary_color": "#FFFFFF",
            "outline_color": "#333333",
            "outline_width": 1,
            "shadow_offset": 0,
            "alignment": "bottom_center",
            "margin_bottom": 30,
            "highlight_words": False,
        },
    },
    {
        "id": "preset_sub_social_native",
        "name": "Social Native",
        "preset_type": "subtitle",
        "is_system": True,
        "config": {
            "font_name": "Montserrat",
            "font_size": 24,
            "bold": True,
            "italic": False,
            "primary_color": "#FFFFFF",
            "outline_color": "#1a1a1a",
            "outline_width": 2.5,
            "shadow_offset": 1.5,
            "alignment": "center",
            "margin_bottom": 80,
            "highlight_words": True,
        },
    },
]


async def get_subtitle_presets(db: AsyncSession) -> list[dict]:
    """Get all subtitle presets (built-in + user custom)."""
    # Start with built-in presets
    presets = [
        {
            "id": p["id"],
            "name": p["name"],
            "config": p["config"],
            "is_system": True,
        }
        for p in BUILTIN_SUBTITLE_PRESETS
    ]

    # Add custom presets from DB
    result = await db.execute(
        select(Preset).where(Preset.preset_type == "subtitle")
    )
    db_presets = result.scalars().all()

    for p in db_presets:
        presets.append({
            "id": p.id,
            "name": p.name,
            "config": json.loads(p.config_json),
            "is_system": p.is_system,
        })

    return presets


def get_preset_config(preset_id: str | None) -> dict:
    """Get the config for a preset by ID. Falls back to bold_clean."""
    if not preset_id:
        return BUILTIN_SUBTITLE_PRESETS[0]["config"]

    for p in BUILTIN_SUBTITLE_PRESETS:
        if p["id"] == preset_id:
            return p["config"]

    return BUILTIN_SUBTITLE_PRESETS[0]["config"]


def generate_ass_subtitles(
    segments: list[TranscriptSegment],
    config: dict,
    clip_start_ms: int,
    clip_end_ms: int,
    output_width: int = 720,
    output_height: int = 1280,
) -> str:
    """Generate an ASS subtitle file string from transcript segments.

    Only includes segments that overlap with the clip time range.
    Timestamps are adjusted relative to clip start.
    """
    font_name = config.get("font_name", "Arial")
    font_size = config.get("font_size", 22)
    bold = -1 if config.get("bold", True) else 0
    italic = -1 if config.get("italic", False) else 0
    primary_color = _hex_to_ass_color(config.get("primary_color", "#FFFFFF"))
    outline_color = _hex_to_ass_color(config.get("outline_color", "#000000"))
    outline_width = config.get("outline_width", 2)
    shadow_offset = config.get("shadow_offset", 1)
    margin_bottom = config.get("margin_bottom", 40)
    alignment = config.get("alignment", "bottom_center")

    # ASS alignment codes
    align_map = {
        "bottom_left": 1,
        "bottom_center": 2,
        "bottom_right": 3,
        "middle_left": 4,
        "center": 5,
        "middle_right": 6,
        "top_left": 7,
        "top_center": 8,
        "top_right": 9,
    }
    align_code = align_map.get(alignment, 2)

    # Build ASS header
    ass = f"""[Script Info]
Title: Clipora Preview Subtitles
ScriptType: v4.00+
PlayResX: {output_width}
PlayResY: {output_height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{primary_color},&H000000FF&,{outline_color},&H80000000&,{bold},{italic},0,0,100,100,0,0,1,{outline_width},{shadow_offset},{align_code},20,20,{margin_bottom},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    # Build dialogue lines
    for seg in segments:
        # Only include segments that overlap with clip range
        if seg.end_ms <= clip_start_ms or seg.start_ms >= clip_end_ms:
            continue

        # Adjust timestamps relative to clip start
        rel_start = max(0, seg.start_ms - clip_start_ms)
        rel_end = min(clip_end_ms - clip_start_ms, seg.end_ms - clip_start_ms)

        start_ts = _ms_to_ass_time(rel_start)
        end_ts = _ms_to_ass_time(rel_end)

        # Clean text for ASS
        text = seg.text.replace("\n", "\\N").strip()
        if not text:
            continue

        ass += f"Dialogue: 0,{start_ts},{end_ts},Default,,0,0,0,,{text}\n"

    return ass


def write_ass_file(ass_content: str, output_path: str) -> str:
    """Write ASS content to file and return the path."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(ass_content, encoding="utf-8")
    return str(path)


def _hex_to_ass_color(hex_color: str) -> str:
    """Convert #RRGGBB to ASS &HAABBGGRR format."""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) != 6:
        return "&H00FFFFFF&"
    r = hex_color[0:2]
    g = hex_color[2:4]
    b = hex_color[4:6]
    return f"&H00{b}{g}{r}&"


def _ms_to_ass_time(ms: int) -> str:
    """Convert milliseconds to ASS timestamp format H:MM:SS.CC."""
    total_cs = ms // 10  # centiseconds
    h = total_cs // 360000
    total_cs %= 360000
    m = total_cs // 6000
    total_cs %= 6000
    s = total_cs // 100
    cs = total_cs % 100
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"
