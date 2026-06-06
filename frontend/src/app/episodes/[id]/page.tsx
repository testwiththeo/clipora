"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, type Episode, type Clip } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AiPickList } from "@/components/ui/ai-pick-list";
import {
  ArrowLeft,
  Trash2,
  ExternalLink,
  Film,
  Clock,
  User,
  AlertCircle,
} from "lucide-react";

export default function EpisodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const episodeId = params.id as string;

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEpisode() {
      const result = await api.getEpisode(episodeId);
      if (result.success && result.data) {
        setEpisode(result.data);
      } else {
        setError(result.error?.message ?? "Episode not found");
      }
      setLoading(false);
    }
    fetchEpisode();
  }, [episodeId]);

  const handleDelete = async () => {
    if (!confirm("Delete this episode and all related data?")) return;
    const result = await api.deleteEpisode(episodeId);
    if (result.success) router.push("/");
  };

  const handleClipCreated = (clip: Clip) => {
    // Clip created — navigation handled by AiPickList
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={28} className="mb-3 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="link" asChild className="mt-3">
          <Link href="/">Back to episodes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/">
          <ArrowLeft size={14} className="mr-1.5" />
          All Episodes
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {episode.title}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={
              episode.transcript_status === "transcript_ready" || episode.transcript_status === "ready"
                ? "success"
                : episode.transcript_status === "failed"
                  ? "error"
                  : "warning"
            }>
              {episode.transcript_status.replace("_", " ")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {episode.channel_name ?? "Unknown channel"}
            </span>
            {episode.duration_seconds && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(episode.duration_seconds)}
              </span>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
          <Trash2 size={14} className="mr-1.5" />
          Delete
        </Button>
      </div>

      {/* Main layout: 60/40 split */}
      <div className="grid grid-cols-5 gap-6">
        {/* Left column — Transcript + Description */}
        <div className="col-span-3 space-y-6">
          {/* Thumbnail */}
          {episode.thumbnail_url && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-xl border border-border"
            >
              <img
                src={episode.thumbnail_url}
                alt={episode.title}
                className="w-full object-cover"
                style={{ maxHeight: "280px" }}
              />
            </motion.div>
          )}

          {/* Description */}
          {episode.description && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <h3 className="mb-3 text-sm font-medium">Description</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {episode.description.slice(0, 1000)}
                {episode.description.length > 1000 && "..."}
              </p>
            </motion.div>
          )}

          {/* Transcript */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card"
          >
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-medium">Transcript</h3>
            </div>
            <TranscriptSection episodeId={episode.id} transcriptStatus={episode.transcript_status} />
          </motion.div>
        </div>

        {/* Right column — AI Picks */}
        <div className="col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="sticky top-6 rounded-xl border border-border bg-card"
          >
            <AiPickList
              episodeId={episode.id}
              analysisStatus={episode.analysis_status}
              transcriptStatus={episode.transcript_status}
              onClipCreated={handleClipCreated}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function TranscriptSection({ episodeId, transcriptStatus }: { episodeId: string; transcriptStatus: string }) {
  const [segments, setSegments] = useState<Array<{ id: string; start_ms: number; text: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transcriptStatus === "transcript_ready" || transcriptStatus === "ready") {
      async function fetch() {
        setLoading(true);
        const result = await api.getTranscript(episodeId);
        if (result.success && result.data) {
          setSegments(result.data.segments);
        }
        setLoading(false);
      }
      fetch();
    }
  }, [episodeId, transcriptStatus]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No transcript available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="divide-y divide-border">
        {segments.map((seg) => (
          <div key={seg.id} className="flex gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
            <span className="mt-0.5 w-12 shrink-0 font-mono text-xs text-primary">
              {formatMs(seg.start_ms)}
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {seg.text}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
