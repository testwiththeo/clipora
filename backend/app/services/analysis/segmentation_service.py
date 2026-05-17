"""Transcript segmentation — group segments into candidate windows."""

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class TranscriptSegment:
    start_ms: int
    end_ms: int
    text: str


@dataclass
class ContentWindow:
    """A candidate window of transcript content for scoring."""
    start_ms: int
    end_ms: int
    text: str
    segment_count: int

    @property
    def duration_ms(self) -> int:
        return self.end_ms - self.start_ms

    @property
    def duration_seconds(self) -> float:
        return self.duration_ms / 1000.0


def segment_into_windows(
    segments: list[TranscriptSegment],
    min_duration_s: int = 20,
    max_duration_s: int = 60,
    overlap_s: int = 5,
) -> list[ContentWindow]:
    """Create overlapping sliding windows from transcript segments.

    Groups consecutive segments into windows of min-max duration,
    with overlap to avoid cutting interesting content at boundaries.
    """
    if not segments:
        return []

    min_ms = min_duration_s * 1000
    max_ms = max_duration_s * 1000
    overlap_ms = overlap_s * 1000

    windows: list[ContentWindow] = []
    window_start_idx = 0

    while window_start_idx < len(segments):
        window_segments: list[TranscriptSegment] = []
        current_start = segments[window_start_idx].start_ms
        current_end = current_start

        # Accumulate segments into this window
        for i in range(window_start_idx, len(segments)):
            seg = segments[i]
            candidate_end = seg.end_ms
            candidate_duration = candidate_end - current_start

            if candidate_duration > max_ms and window_segments:
                break

            window_segments.append(seg)
            current_end = candidate_end

            if candidate_duration >= min_ms:
                # Check if adding more would still be within max
                if i + 1 < len(segments):
                    next_end = segments[i + 1].end_ms
                    if next_end - current_start > max_ms:
                        break

        if not window_segments:
            window_start_idx += 1
            continue

        # Build window text
        text = " ".join(seg.text for seg in window_segments)

        windows.append(ContentWindow(
            start_ms=window_segments[0].start_ms,
            end_ms=window_segments[-1].end_ms,
            text=text,
            segment_count=len(window_segments),
        ))

        # Advance start index, respecting overlap
        advance = max(1, len(window_segments) // 2)
        # Try to find a start that gives us ~overlap seconds of overlap
        target_overlap_start = window_segments[-1].end_ms - overlap_ms
        next_start_idx = window_start_idx + advance

        for i in range(window_start_idx + 1, min(window_start_idx + len(window_segments), len(segments))):
            if segments[i].start_ms >= target_overlap_start:
                next_start_idx = i
                break

        window_start_idx = max(window_start_idx + 1, next_start_idx)

    logger.info(f"Segmented {len(segments)} segments into {len(windows)} windows")
    return windows
