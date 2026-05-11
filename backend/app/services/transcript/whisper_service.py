"""Whisper-based transcription fallback for videos without YouTube transcripts."""

import asyncio
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class WhisperSegment:
    """A single segment from Whisper transcription."""
    start: float  # seconds
    end: float  # seconds
    text: str


async def transcribe_with_whisper(
    audio_path: str,
    model_size: str = "base",
) -> list[WhisperSegment]:
    """Transcribe audio file using faster-whisper.

    Falls back to a subprocess-based approach if faster-whisper is not installed.
    """
    try:
        return await _transcribe_faster_whisper(audio_path, model_size)
    except ImportError:
        logger.warning("faster-whisper not installed, trying whisper CLI fallback")
        return await _transcribe_cli_fallback(audio_path, model_size)


async def _transcribe_faster_whisper(
    audio_path: str,
    model_size: str,
) -> list[WhisperSegment]:
    """Transcribe using faster-whisper library."""
    loop = asyncio.get_event_loop()

    def _transcribe():
        from faster_whisper import WhisperModel

        model = WhisperModel(model_size, device="auto", compute_type="auto")
        segments_iter, info = model.transcribe(
            audio_path,
            language="en",
            beam_size=5,
            vad_filter=True,
        )

        logger.info(
            f"Whisper ({model_size}): detected language={info.language} "
            f"(probability={info.language_probability:.2f})"
        )

        return [
            WhisperSegment(
                start=seg.start,
                end=seg.end,
                text=seg.text.strip(),
            )
            for seg in segments_iter
        ]

    segments = await loop.run_in_executor(None, _transcribe)
    logger.info(f"Whisper transcribed {len(segments)} segments from {audio_path}")
    return segments


async def _transcribe_cli_fallback(
    audio_path: str,
    model_size: str,
) -> list[WhisperSegment]:
    """Fallback: use whisper CLI via subprocess to produce a JSON output."""
    import json
    import tempfile
    from pathlib import Path

    output_dir = tempfile.mkdtemp(prefix="clipora_whisper_")

    cmd = [
        "whisper",
        audio_path,
        "--model", model_size,
        "--language", "en",
        "--output_format", "json",
        "--output_dir", output_dir,
    ]

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    _, stderr = await process.communicate()

    if process.returncode != 0:
        error_msg = stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"Whisper CLI failed: {error_msg}")

    # Parse the JSON output
    json_files = list(Path(output_dir).glob("*.json"))
    if not json_files:
        raise RuntimeError("Whisper produced no output")

    with open(json_files[0]) as f:
        data = json.load(f)

    segments = [
        WhisperSegment(
            start=seg["start"],
            end=seg["end"],
            text=seg["text"].strip(),
        )
        for seg in data.get("segments", [])
    ]

    logger.info(f"Whisper CLI transcribed {len(segments)} segments from {audio_path}")
    return segments
