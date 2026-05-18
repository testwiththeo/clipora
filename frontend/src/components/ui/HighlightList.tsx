"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type HighlightCandidate } from "@/lib/api";
import {
  Loader2,
  Sparkles,
  Play,
  AlertCircle,
  BarChart3,
} from "lucide-react";

interface HighlightListProps {
  episodeId: string;
  analysisStatus: string;
  transcriptStatus: string;
}

export function HighlightList({
  episodeId,
  analysisStatus,
  transcriptStatus,
}: HighlightListProps) {
  const [candidates, setCandidates] = useState<HighlightCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchHighlights = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await api.getHighlights(episodeId);

    if (result.success && result.data) {
      setCandidates(result.data.highlights);
      setLoaded(true);
    } else {
      setError(result.error?.message ?? "Failed to load highlights");
    }

    setLoading(false);
  }, [episodeId]);

  useEffect(() => {
    if (analysisStatus === "ready" && !loaded) {
      fetchHighlights();
    }
  }, [analysisStatus, loaded, fetchHighlights]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);

    const result = await api.analyzeEpisode(episodeId);

    if (result.success) {
      // Re-fetch highlights after analysis
      await fetchHighlights();
    } else {
      setError(result.error?.message ?? "Analysis failed");
    }

    setAnalyzing(false);
  };

  // Can't analyze without transcript
  if (transcriptStatus !== "transcript_ready") {
    return (
      <section className="panel">
        <div className="border-b border-line px-4 py-3">
          <h3 className="text-label font-medium text-content-primary">
            Highlight Candidates
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles size={20} className="mb-2 text-content-muted" />
          <p className="text-body text-content-secondary">
            Transcript required for analysis
          </p>
          <p className="mt-0.5 text-meta text-content-muted">
            Highlights will appear once the transcript is ready
          </p>
        </div>
      </section>
    );
  }

  // Analyzing state
  if (analyzing) {
    return (
      <section className="panel">
        <div className="border-b border-line px-4 py-3">
          <h3 className="text-label font-medium text-content-primary">
            Highlight Candidates
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2 size={20} className="mb-2 animate-spin text-accent" />
          <p className="text-body text-content-secondary">Analyzing transcript...</p>
          <p className="mt-0.5 text-meta text-content-muted">
            Scoring segments for highlight potential
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-label font-medium text-content-primary">
            Highlight Candidates
          </h3>
          {loaded && candidates.length > 0 && (
            <span className="text-meta text-content-muted">
              {candidates.length} found
            </span>
          )}
        </div>
        <button
          className="btn-secondary flex items-center gap-1.5"
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Sparkles size={13} />
          )}
          {loaded ? "Re-analyze" : "Analyze"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 border-b border-line bg-status-error/5 px-4 py-2 text-meta text-status-error">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {loading && !loaded ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin text-content-muted" />
        </div>
      ) : loaded && candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BarChart3 size={20} className="mb-2 text-content-muted" />
          <p className="text-body text-content-secondary">No highlights found</p>
          <p className="mt-0.5 text-meta text-content-muted">
            Click Analyze to scan the transcript for clip-worthy moments
          </p>
        </div>
      ) : (
        <div className="max-h-[500px] divide-y divide-line overflow-y-auto">
          {candidates.map((c, idx) => (
            <CandidateRow key={c.id} candidate={c} rank={idx + 1} />
          ))}
        </div>
      )}
    </section>
  );
}

function CandidateRow({
  candidate,
  rank,
}: {
  candidate: HighlightCandidate;
  rank: number;
}) {
  const durationS = Math.round((candidate.end_ms - candidate.start_ms) / 1000);
  const scorePercent = Math.round(candidate.score * 100);

  return (
    <div className="flex gap-3 px-4 py-3 transition-colors hover:bg-app-hover">
      {/* Rank + Score */}
      <div className="flex flex-shrink-0 flex-col items-center gap-1 pt-0.5">
        <span className="text-meta font-medium text-content-muted">
          #{rank}
        </span>
        <ScoreBadge score={candidate.score} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-content-primary">
          {candidate.title ?? "Untitled candidate"}
        </p>
        <div className="mt-1 flex items-center gap-3 text-meta text-content-muted">
          <span className="flex items-center gap-1">
            <Play size={11} />
            {formatMs(candidate.start_ms)} – {formatMs(candidate.end_ms)}
          </span>
          <span>{durationS}s</span>
        </div>
        {candidate.summary && (
          <p className="mt-1.5 line-clamp-2 text-meta text-content-secondary">
            {candidate.summary}
          </p>
        )}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 0.5
      ? "bg-status-success/10 text-status-success"
      : score >= 0.3
        ? "bg-status-warning/10 text-status-warning"
        : "bg-content-muted/10 text-content-muted";

  return (
    <span className={`rounded-control px-1.5 py-0.5 text-[11px] font-medium ${color}`}>
      {Math.round(score * 100)}%
    </span>
  );
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
