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
    # Additional patterns for more variety
    r"\b(imagine|picture this|think about it|consider this)\b",
    r"\b(not only|but also|on the other hand|at the same time)\b",
    r"\b(the reality is|the truth is|in fact|actually)\b",
    r"\b(what if|what would|how would|why would)\b",
    r"\b(it'?s not about|it'?s about|the question is)\b",
    r"\b(let me tell you|I'?ll tell you|here'?s what)\b",
    r"\b(did you know|you might not know|few people know)\b",
    r"\b(the irony|the paradox|the contradiction)\b",
]

QUESTION_PATTERN = re.compile(r"\?")
EXCLAMATION_PATTERN = re.compile(r"!")

# Short punchy sentences work well as hooks
PUNCHY_SENTENCE_MAX_WORDS = 10
# Strong opening patterns
HOOK_PATTERNS = [
    r"^(but|so|and|now|look|listen|okay|imagine|think|here|this|that|what|why|how)\b",
]


@dataclass
class ScoreRationale:
    """Breakdown of why a window scored the way it did."""
    text_density: float = 0.0
    lexical_diversity: float = 0.0
    signal_phrases: float = 0.0
    engagement_signals: float = 0.0
    structural_quality: float = 0.0
    duration_fitness: float = 0.0
    hook_quality: float = 0.0
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
            rationale.text_density = 0.9
        elif 1.0 <= wps <= 4.5:
            rationale.text_density = 0.6
        else:
            rationale.text_density = 0.2

        # 2. Lexical diversity — unique words / total words
        unique_words = set(words)
        diversity = len(unique_words) / max(word_count, 1)
        rationale.lexical_diversity = min(diversity * 1.5, 1.0)

        # 3. Signal phrases — DENSITY based (matches per 100 words)
        # This prevents longer windows from automatically scoring higher
        signal_count = 0
        for pattern in SIGNAL_PATTERNS:
            matches = re.findall(pattern, text)
            if matches:
                signal_count += len(matches)
                rationale.matched_signals.extend(matches[:3])

        # Density: signals per 100 words, normalized
        signal_density = (signal_count / max(word_count, 1)) * 100
        rationale.signal_phrases = min(signal_density * 0.5, 1.0)

        # 4. Engagement signals — questions, exclamations, short punchy lines
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]

        question_count = len(QUESTION_PATTERN.findall(text))
        exclamation_count = len(EXCLAMATION_PATTERN.findall(text))
        has_short_punchy = any(
            len(s.split()) <= PUNCHY_SENTENCE_MAX_WORDS and len(s.split()) >= 3
            for s in sentences
        )

        engagement = 0.0
        engagement += min(question_count * 0.12, 0.35)
        engagement += min(exclamation_count * 0.08, 0.15)
        if has_short_punchy:
            engagement += 0.3
        if len(sentences) >= 3:
            engagement += 0.15
        rationale.engagement_signals = min(engagement, 1.0)

        # 5. Structural quality — good sentence count and variety
        sentence_count = len(sentences)
        if 3 <= sentence_count <= 12:
            rationale.structural_quality = 0.8
        elif 2 <= sentence_count <= 15:
            rationale.structural_quality = 0.5
        else:
            rationale.structural_quality = 0.3

        # 6. Duration fitness — FLAT across acceptable range (15-60s)
        # Short clips are not penalized. Only extreme durations get penalized.
        dur = window.duration_seconds
        if 15 <= dur <= 60:
            # Sweet spot — all durations in this range are equally fit
            rationale.duration_fitness = 0.9
        elif 10 <= dur < 15:
            rationale.duration_fitness = 0.7
        elif 60 < dur <= 90:
            rationale.duration_fitness = 0.6
        elif dur < 10:
            rationale.duration_fitness = 0.3
        else:
            rationale.duration_fitness = 0.2

        # 7. Hook quality — does the clip start with a strong opening?
        first_sentence = sentences[0] if sentences else ""
        hook_score = 0.0
        for pattern in HOOK_PATTERNS:
            if re.search(pattern, first_sentence.lower()):
                hook_score = 0.4
                break
        # Bonus if first sentence is a question
        if "?" in first_sentence:
            hook_score += 0.3
        # Bonus if first sentence is short and punchy
        if 3 <= len(first_sentence.split()) <= PUNCHY_SENTENCE_MAX_WORDS:
            hook_score += 0.3
        rationale.hook_quality = min(hook_score, 1.0)

        # Weighted total — rebalanced: less duration, more content quality
        score = (
            rationale.text_density * 0.10
            + rationale.lexical_diversity * 0.10
            + rationale.signal_phrases * 0.30      # Content quality is king
            + rationale.engagement_signals * 0.20
            + rationale.structural_quality * 0.08
            + rationale.duration_fitness * 0.07     # Duration matters less
            + rationale.hook_quality * 0.15         # Strong hooks for short-form
        )

        score = min(max(score, 0.0), 1.0)

        title = _generate_title(sentences, text)

        scored.append(ScoredWindow(
            window=window,
            score=round(score, 3),
            rationale=rationale,
            title=title,
        ))

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
