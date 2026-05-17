"""Heuristic highlight scoring — identify promising clip candidates."""

import logging
import math
import re
from dataclasses import dataclass, field

from app.services.analysis.segmentation_service import ContentWindow

logger = logging.getLogger(__name__)

# Phrases that signal interesting content
SIGNAL_PATTERNS = [
    r"\b(the key|the point|the truth|the secret|the thing is|here'?s the thing)\b",
    r"\b(what most people|most people don'?t|nobody talks about|everyone thinks)\b",
    r"\b(I think|I believe|I learned|I realized|I discovered|I figured out)\b",
    r"\b(the biggest|the most important|the number one|#1)\b",
    r"\b(look,|listen,|honestly,|frankly,|real talk)\b",
    r"\b(but here'?s|and that'?s why|so what happens|the problem is)\b",
    r"\b(remember this|takeaway|lesson|bottom line)\b",
]

# Questions tend to be engaging clip hooks
QUESTION_PATTERN = re.compile(r"\?")

# Short punchy sentences tend to work well in clips
PUNCHY_SENTENCE_MAX_WORDS = 12


@dataclass
class ScoreRationale:
    """Breakdown of why a window scored the way it did."""
    text_density: float = 0.0
    lexical_diversity: float = 0.0
    signal_phrases: float = 0.0
    engagement_signals: float = 0.0
    structural_quality: float = 0.0
    duration_fitness: float = 0.0
    matched_signals: list[str] = field(default_factory=list)


@dataclass
class ScoredWindow:
    """A content window with its highlight score."""
    window: ContentWindow
    score: float
    rationale: ScoreRationale
    title: str


def score_windows(
    windows: list[ContentWindow],
    target_duration_s: int = 40,
) -> list[ScoredWindow]:
    """Score all content windows and return them sorted by score (highest first)."""
    if not windows:
        return []

    scored = []
    for window in windows:
        rationale = ScoreRationale()
        text = window.text.lower()
        words = text.split()
        word_count = len(words)

        if word_count < 5:
            continue

        # 1. Text density (words per second) — moderate density is ideal
        wps = word_count / max(window.duration_seconds, 1)
        if 1.5 <= wps <= 3.5:
            rationale.text_density = 0.8
        elif 1.0 <= wps <= 4.5:
            rationale.text_density = 0.5
        else:
            rationale.text_density = 0.2

        # 2. Lexical diversity — unique words / total words
        unique_words = set(words)
        diversity = len(unique_words) / max(word_count, 1)
        rationale.lexical_diversity = min(diversity * 1.5, 1.0)

        # 3. Signal phrases — content that sounds quotable/insightful
        signal_count = 0
        for pattern in SIGNAL_PATTERNS:
            matches = re.findall(pattern, text)
            if matches:
                signal_count += len(matches)
                rationale.matched_signals.extend(matches[:3])

        rationale.signal_phrases = min(signal_count * 0.2, 1.0)

        # 4. Engagement signals — questions, exclamations, short punchy lines
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]

        question_count = len(QUESTION_PATTERN.findall(text))
        has_short_punchy = any(
            len(s.split()) <= PUNCHY_SENTENCE_MAX_WORDS and len(s.split()) >= 3
            for s in sentences
        )

        engagement = 0.0
        engagement += min(question_count * 0.15, 0.4)
        if has_short_punchy:
            engagement += 0.3
        if len(sentences) >= 3:
            engagement += 0.2
        rationale.engagement_signals = min(engagement, 1.0)

        # 5. Structural quality — good sentence count and variety
        sentence_count = len(sentences)
        if 3 <= sentence_count <= 12:
            rationale.structural_quality = 0.8
        elif 2 <= sentence_count <= 15:
            rationale.structural_quality = 0.5
        else:
            rationale.structural_quality = 0.3

        # 6. Duration fitness — how close to ideal clip length
        duration_diff = abs(window.duration_seconds - target_duration_s)
        rationale.duration_fitness = max(0, 1.0 - (duration_diff / target_duration_s))

        # Weighted total
        score = (
            rationale.text_density * 0.12
            + rationale.lexical_diversity * 0.15
            + rationale.signal_phrases * 0.25
            + rationale.engagement_signals * 0.20
            + rationale.structural_quality * 0.10
            + rationale.duration_fitness * 0.18
        )

        # Normalize to 0-1
        score = min(max(score, 0.0), 1.0)

        title = _generate_title(sentences, text)

        scored.append(ScoredWindow(
            window=window,
            score=round(score, 3),
            rationale=rationale,
            title=title,
        ))

    # Sort by score descending
    scored.sort(key=lambda sw: sw.score, reverse=True)
    logger.info(f"Scored {len(scored)} windows, top score: {scored[0].score if scored else 0}")
    return scored


def _generate_title(sentences: list[str], full_text: str) -> str:
    """Generate a short title from the most interesting sentence."""
    if not sentences:
        return full_text[:60]

    # Prefer sentences with signal phrases
    for sentence in sentences:
        for pattern in SIGNAL_PATTERNS:
            if re.search(pattern, sentence.lower()):
                clean = sentence.strip()[:80]
                return clean[0].upper() + clean[1:] if clean else sentence

    # Fall back to the longest meaningful sentence
    best = max(sentences, key=len)
    clean = best.strip()[:80]
    return clean[0].upper() + clean[1:] if clean else full_text[:60]
