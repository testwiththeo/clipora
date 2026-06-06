"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type TranscriptSegment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, AlertCircle, RotateCcw, Mic } from "lucide-react";

interface TranscriptViewerProps {
  episodeId: string;
  transcriptStatus: string;
}

export function TranscriptViewer({ episodeId, transcriptStatus }: TranscriptViewerProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchTranscript = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await api.getTranscript(episodeId);

    if (result.success && result.data) {
      setSegments(result.data.segments);
      setLoaded(true);
    } else {
      setError(result.error?.message ?? "Failed to load transcript");
    }

    setLoading(false);
  }, [episodeId]);

  // Auto-fetch when transcript is ready
  useEffect(() => {
    if (transcriptStatus === "transcript_ready" && !loaded) {
      fetchTranscript();
    }
  }, [transcriptStatus, loaded, fetchTranscript]);

  const handleRebuild = async () => {
    setLoading(true);
    const result = await api.rebuildTranscript(episodeId);
    if (result.success) {
      // Poll after a delay
      setTimeout(fetchTranscript, 5000);
    } else {
      setError(result.error?.message ?? "Rebuild failed");
      setLoading(false);
    }
  };

  const handleWhisper = async () => {
    setLoading(true);
    const result = await api.whisperTranscript(episodeId);
    if (result.success) {
      setTimeout(fetchTranscript, 10000);
    } else {
      setError(result.error?.message ?? "Whisper transcription failed");
      setLoading(false);
    }
  };

  // Pending / importing states
  if (transcriptStatus === "pending") {
    return (
      <TranscriptPlaceholder
        icon={<FileText size={20} />}
        message="Transcript not yet fetched"
        hint="Transcript will be retrieved during import"
      />
    );
  }

  if (transcriptStatus === "importing") {
    return (
      <TranscriptPlaceholder
        icon={<Loader2 size={20} className="animate-spin" />}
        message="Fetching transcript..."
        hint="This may take a moment"
      />
    );
  }

  if (transcriptStatus === "failed" && !loaded) {
    return (
      <div className="border border-border bg-card rounded-xl">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm text-foreground">Transcript</h3>
        </div>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2 text-body text-status-error">
            <AlertCircle size={16} />
            Transcript unavailable
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-1.5" onClick={handleRebuild}>
              <RotateCcw size={14} />
              Retry YouTube
            </button>
            <button className="btn-secondary flex items-center gap-1.5" onClick={handleWhisper}>
              <Mic size={14} />
              Use Whisper
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !loaded) {
    return (
      <TranscriptPlaceholder
        icon={<Loader2 size={20} className="animate-spin" />}
        message="Loading transcript..."
        hint=""
      />
    );
  }

  if (loaded && segments.length === 0) {
    return (
      <TranscriptPlaceholder
        icon={<FileText size={20} />}
        message="No transcript segments found"
        hint="Try rebuilding the transcript"
      />
    );
  }

  return (
    <div className="border border-border bg-card rounded-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm text-foreground">Transcript</h3>
          <span className="text-sm text-muted-foreground">
            {segments.length} segments
          </span>
        </div>
        <button
          className="btn-ghost text-meta"
          onClick={handleRebuild}
          disabled={loading}
          title="Rebuild transcript"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 border-b border-border bg-status-error/5 px-4 py-2 text-meta text-status-error">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      <div className="max-h-[500px] divide-y divide-border overflow-y-auto">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="flex gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
          >
            <span className="mt-0.5 w-14 flex-shrink-0 font-mono text-meta text-accent">
              {formatMs(seg.start_ms)}
            </span>
            <p className="text-body leading-relaxed text-content-secondary">
              {seg.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TranscriptPlaceholder({
  icon,
  message,
  hint,
}: {
  icon: React.ReactNode;
  message: string;
  hint: string;
}) {
  return (
    <div className="border border-border bg-card rounded-xl">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm text-foreground">Transcript</h3>
      </div>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-2 text-content-muted">{icon}</div>
        <p className="text-sm text-muted-foreground">{message}</p>
        {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
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
