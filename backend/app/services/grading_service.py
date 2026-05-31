"""Color grading service — generate FFmpeg filter strings from grading config."""

import logging

logger = logging.getLogger(__name__)

# Default grading values (no adjustment)
DEFAULT_GRADE = {
    "brightness": 0.0,
    "contrast": 1.0,
    "saturation": 1.0,
    "temperature": 0.0,
}

# Built-in grading presets
BUILTIN_GRADING_PRESETS = [
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
    {
        "id": "cinematic",
        "name": "Cinematic",
        "config": {"brightness": -0.02, "contrast": 1.15, "saturation": 0.85, "temperature": -0.03},
    },
    {
        "id": "vibrant",
        "name": "Vibrant",
        "config": {"brightness": 0.02, "contrast": 1.05, "saturation": 1.25, "temperature": 0.01},
    },
]


def get_grading_preset(preset_id: str | None) -> dict:
    """Get grading config for a preset ID. Falls back to default (no adjustment)."""
    if not preset_id or preset_id == "none":
        return DEFAULT_GRADE.copy()

    for preset in BUILTIN_GRADING_PRESETS:
        if preset["id"] == preset_id:
            return preset["config"].copy()

    return DEFAULT_GRADE.copy()


def parse_clip_grade(grade_json: str | None) -> dict:
    """Parse a clip's grade_json field into a grading config dict."""
    if not grade_json:
        return DEFAULT_GRADE.copy()

    import json
    try:
        data = json.loads(grade_json)
    except (json.JSONDecodeError, TypeError):
        return DEFAULT_GRADE.copy()

    # If it references a preset, resolve it
    preset_id = data.get("preset")
    if preset_id:
        config = get_grading_preset(preset_id)
        # Merge custom overrides
        for key in DEFAULT_GRADE:
            if key in data:
                config[key] = data[key]
        return config

    # Otherwise use raw values
    config = DEFAULT_GRADE.copy()
    for key in DEFAULT_GRADE:
        if key in data:
            config[key] = data[key]
    return config


def build_grading_filter(grade: dict) -> str | None:
    """Build an FFmpeg video filter string from grading config.

    Returns None if no adjustments are needed (all defaults).
    Produces an eq + colorbalance filter chain.
    """
    brightness = grade.get("brightness", 0)
    contrast = grade.get("contrast", 1)
    saturation = grade.get("saturation", 1)
    temperature = grade.get("temperature", 0)

    # Check if any adjustment is active
    has_eq = brightness != 0 or contrast != 1 or saturation != 1
    has_temp = temperature != 0

    if not has_eq and not has_temp:
        return None

    filters = []

    # eq filter: brightness, contrast, saturation
    if has_eq:
        eq_parts = []
        if brightness != 0:
            eq_parts.append(f"brightness={brightness:.3f}")
        if contrast != 1:
            eq_parts.append(f"contrast={contrast:.3f}")
        if saturation != 1:
            eq_parts.append(f"saturation={saturation:.3f}")
        filters.append(f"eq={':'.join(eq_parts)}")

    # colorbalance for temperature (warm/cool shift)
    if has_temp:
        # Positive = warm (red/yellow), Negative = cool (blue/cyan)
        temp = temperature
        rs = gs = bs = 0.0
        rm = gm = bm = 0.0

        if temp > 0:
            # Warm: boost reds/yellows in shadows and midtones
            rs = temp * 0.5
            rm = temp * 0.3
            gs = temp * 0.15
        else:
            # Cool: boost blues/cyans
            bs = abs(temp) * 0.5
            bm = abs(temp) * 0.3
            gs = abs(temp) * 0.1

        cb_parts = []
        if rs != 0:
            cb_parts.append(f"rs={rs:.3f}")
        if gs != 0:
            cb_parts.append(f"gs={gs:.3f}")
        if bs != 0:
            cb_parts.append(f"bs={bs:.3f}")
        if rm != 0:
            cb_parts.append(f"rm={rm:.3f}")
        if gm != 0:
            cb_parts.append(f"gm={gm:.3f}")
        if bm != 0:
            cb_parts.append(f"bm={bm:.3f}")

        if cb_parts:
            filters.append(f"colorbalance={':'.join(cb_parts)}")

    return ",".join(filters) if filters else None
