"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api, type HighlightCandidate, type Clip } from "@/lib/api";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2, Sparkles, Scissors } from "lucide-react";

interface AiPickListProps {
  episodeId: string;
  analysisStatus: string;
  transcriptStatus: string;
  onClipCreated?: (clip: Clip) => void;
}

export function AiPickList({
  episodeId,
  analysisStatus,
  transcriptStatus,
  onClipCreated,
}: AiPickListProps) {
  const [candidates, setCandidates] = useState<HighlightCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  const fetchHighlights = useCallback(async () => {
    setLoading(true);
    const result = await api.getHighlights(episodeId);
    if (result.success && result.data) {
      setCandidates(result.data.highlights);
      setLoaded(true);
    }
    setLoading(false);
  }, [episodeId]);

  // Auto-fetch when analysis is ready
  useEffect(() => {
    if (analysisStatus === "ready" && !loaded) {
      fetchHighlights();
    }
  }, [analysisStatus, loaded, fetchHighlights]);

  // Auto-analyze when transcript is ready
  useEffect(() => {
    if (transcriptStatus === "transcript_ready" && analysisStatus !== "ready" && !analyzing) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptStatus, analysisStatus]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await api.analyzeEpisode(episodeId);
    if (result.success) {
      await fetchHighlights();
    }
    setAnalyzing(false);
  };

  const handleCreateClip = async (candidate: HighlightCandidate) => {
    setCreatingId(candidate.id);
    const result = await api.createClip({
      episode_id: episodeId,
      candidate_id: candidate.id,
      start_ms: candidate.start_ms,
      end_ms: candidate.end_ms,
      title: candidate.title ?? undefined,
    });
    if (result.success && result.data) {
      onClipCreated?.(result.data);
      router.push(`/editor/${result.data.id}`);
    }
    setCreatingId(null);
  };

  if (transcriptStatus !== "transcript_ready") {
    return (
      <EmptyState
        icon={<Sparkles size={20} />}
        title="Transcript required"
        description="AI Picks will appear once the transcript is ready."
      />
    );
  }

  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 size={20} className="mb-2 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Finding best moments...</p>
      </div>
    );
  }

  if (loading && !loaded) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (loaded && candidates.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles size={20} />}
        title="No AI Picks found"
        description="We couldn't find any clip-worthy moments. Try a different episode."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">AI Picks</h3>
          {loaded && candidates.length > 0 && (
            <span className="text-xs text-muted-foreground">{candidates.length} found</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzing}>
          <Sparkles size={13} className="mr-1" />
          Re-analyze
        </Button>
      </div>

      <div className="max-h-[500px] divide-y divide-border overflow-y-auto">
        {candidates.map((c, idx) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.15 }}
            className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            {/* Rank */}
            <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
              <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
              <ConfidenceBadge score={c.score} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {c.title ?? "Untitled"}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatMs(c.start_ms)} – {formatMs(c.end_ms)}</span>
                <span>{Math.round((c.end_ms - c.start_ms) / 1000)}s</span>
              </div>
              {c.summary && (
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                  {c.summary}
                </p>
              )}
            </div>

            {/* Action */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 self-center text-muted-foreground hover:text-primary"
              onClick={() => handleCreateClip(c)}
              disabled={creatingId === c.id}
              title="Create clip from this pick"
            >
              {creatingId === c.id ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Scissors size={15} />
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
