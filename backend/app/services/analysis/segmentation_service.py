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
    min_duration_s: int = 15,
    max_duration_s: int = 90,
    overlap_s: int = 5,
) -> list[ContentWindow]:
    """Create overlapping sliding windows at multiple duration tiers.

    Generates windows at 3 duration tiers to capture both short punchy
    moments and longer narrative segments:
    - Short: 15-30s (punchy quotes, quick insights)
    - Medium: 25-55s (standard clip length)
    - Long: 45-90s (storytelling segments)
    """
    if not segments:
        return []

    all_windows: list[ContentWindow] = []

    # Multi-tier segmentation for variety
    tiers = [
        (15, 30, 3),   # Short: 15-30s windows, advance by 3 segments
        (25, 55, 4),   # Medium: 25-55s windows, advance by 4 segments
        (45, 90, 5),   # Long: 45-90s windows, advance by 5 segments
    ]

    for min_s, max_s, advance_count in tiers:
        windows = _build_windows_for_tier(segments, min_s, max_s, advance_count)
        all_windows.extend(windows)

    # Deduplicate: remove windows that overlap >70% with a higher-scoring window
    deduped = _deduplicate_windows(all_windows)

    logger.info(
        f"Segmented {len(segments)} segments into {len(deduped)} windows "
        f"({len(all_windows)} before dedup) across 3 tiers"
    )
    return deduped


def _build_windows_for_tier(
    segments: list[TranscriptSegment],
    min_duration_s: int,
    max_duration_s: int,
    advance_count: int,
) -> list[ContentWindow]:
    """Build windows for a single duration tier."""
    min_ms = min_duration_s * 1000
    max_ms = max_duration_s * 1000

    windows: list[ContentWindow] = []
    window_start_idx = 0

    while window_start_idx < len(segments):
        window_segments: list[TranscriptSegment] = []
        current_start = segments[window_start_idx].start_ms
        current_end = current_start

        for i in range(window_start_idx, len(segments)):
            seg = segments[i]
            candidate_end = seg.end_ms
            candidate_duration = candidate_end - current_start

            if candidate_duration > max_ms and window_segments:
                break

            window_segments.append(seg)
            current_end = candidate_end

            if candidate_duration >= min_ms:
                if i + 1 < len(segments):
                    next_end = segments[i + 1].end_ms
                    if next_end - current_start > max_ms:
                        break

        if not window_segments:
            window_start_idx += 1
            continue

        # Skip windows that are too short
        actual_duration = window_segments[-1].end_ms - window_segments[0].start_ms
        if actual_duration < min_ms * 0.7:
            window_start_idx += 1
            continue

        text = " ".join(seg.text for seg in window_segments)

        windows.append(ContentWindow(
            start_ms=window_segments[0].start_ms,
            end_ms=window_segments[-1].end_ms,
            text=text,
            segment_count=len(window_segments),
        ))

        window_start_idx += advance_count

    return windows


def _deduplicate_windows(
    windows: list[ContentWindow],
    overlap_threshold: float = 0.7,
) -> list[ContentWindow]:
    """Remove near-duplicate windows that overlap significantly."""
    if not windows:
        return []

    # Sort by start time
    windows.sort(key=lambda w: w.start_ms)

    kept: list[ContentWindow] = []

    for window in windows:
        is_duplicate = False
        for existing in kept:
            # Calculate overlap
            overlap_start = max(window.start_ms, existing.start_ms)
            overlap_end = min(window.end_ms, existing.end_ms)
            overlap_duration = max(0, overlap_end - overlap_start)

            shorter_duration = min(
                window.duration_ms,
                existing.duration_ms,
            )

            if shorter_duration > 0 and overlap_duration / shorter_duration > overlap_threshold:
                is_duplicate = True
                break

        if not is_duplicate:
            kept.append(window)

    return kept
