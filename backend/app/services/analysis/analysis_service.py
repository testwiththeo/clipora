"""Analysis orchestrator — run segmentation + scoring and store candidates."""

import json
import logging

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.episode import Episode
from app.models.transcript import TranscriptSegment as DBTranscriptSegment
from app.models.highlight import HighlightCandidate
from app.utils.helpers import generate_id
from app.services.analysis.segmentation_service import (
    TranscriptSegment,
    segment_into_windows,
)
from app.services.analysis.scoring_service import score_windows, ScoredWindow

logger = logging.getLogger(__name__)

# Default scoring config
DEFAULT_MIN_DURATION_S = 20
DEFAULT_MAX_DURATION_S = 60
DEFAULT_TARGET_DURATION_S = 40
DEFAULT_TOP_N = 15
DEFAULT_MIN_SCORE = 0.15


async def analyze_episode(
    episode: Episode,
    db: AsyncSession,
    target_clip_duration_min: int = DEFAULT_MIN_DURATION_S,
    target_clip_duration_max: int = DEFAULT_MAX_DURATION_S,
) -> int:
    """Run full analysis pipeline for an episode.

    1. Load transcript segments from DB
    2. Segment into overlapping content windows
    3. Score each window with heuristic ranking
    4. Store top candidates in DB

    Returns the number of candidates stored.
    """
    # Step 1: Load transcript
    result = await db.execute(
        select(DBTranscriptSegment)
        .where(DBTranscriptSegment.episode_id == episode.id)
        .order_by(DBTranscriptSegment.sequence_index)
    )
    db_segments = list(result.scalars().all())

    if not db_segments:
        raise RuntimeError("No transcript segments found. Fetch transcript first.")

    segments = [
        TranscriptSegment(
            start_ms=seg.start_ms,
            end_ms=seg.end_ms,
            text=seg.text,
        )
        for seg in db_segments
    ]

    logger.info(f"Analysis: loaded {len(segments)} transcript segments for {episode.id}")

    # Step 2: Segment into windows
    windows = segment_into_windows(
        segments,
        min_duration_s=target_clip_duration_min,
        max_duration_s=target_clip_duration_max,
    )

    if not windows:
        raise RuntimeError("Could not create content windows from transcript.")

    # Step 3: Score windows
    target_duration = (target_clip_duration_min + target_clip_duration_max) // 2
    scored = score_windows(windows, target_duration_s=target_duration)

    # Step 4: Clear existing candidates and store top ones
    await db.execute(
        delete(HighlightCandidate).where(HighlightCandidate.episode_id == episode.id)
    )

    top_candidates = [sw for sw in scored if sw.score >= DEFAULT_MIN_SCORE][:DEFAULT_TOP_N]

    for sw in top_candidates:
        rationale = {
            "text_density": round(sw.rationale.text_density, 2),
            "lexical_diversity": round(sw.rationale.lexical_diversity, 2),
            "signal_phrases": round(sw.rationale.signal_phrases, 2),
            "engagement_signals": round(sw.rationale.engagement_signals, 2),
            "structural_quality": round(sw.rationale.structural_quality, 2),
            "duration_fitness": round(sw.rationale.duration_fitness, 2),
            "matched_signals": sw.rationale.matched_signals[:5],
        }

        candidate = HighlightCandidate(
            id=generate_id("hc"),
            episode_id=episode.id,
            start_ms=sw.window.start_ms,
            end_ms=sw.window.end_ms,
            title=sw.title,
            summary=sw.window.text[:300],
            score=sw.score,
            rationale_json=json.dumps(rationale),
        )
        db.add(candidate)

    await db.commit()

    # Update episode status
    episode.analysis_status = "ready" if top_candidates else "failed"
    await db.commit()

    logger.info(f"Analysis complete for {episode.id}: {len(top_candidates)} candidates stored")
    return len(top_candidates)


async def get_highlight_candidates(
    episode_id: str,
    db: AsyncSession,
) -> list[HighlightCandidate]:
    """Fetch highlight candidates for an episode, ranked by score."""
    result = await db.execute(
        select(HighlightCandidate)
        .where(HighlightCandidate.episode_id == episode_id)
        .order_by(HighlightCandidate.score.desc())
    )
    return list(result.scalars().all())
