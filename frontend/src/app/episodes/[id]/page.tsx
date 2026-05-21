"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Episode, type Clip } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { TranscriptViewer } from "@/components/ui/TranscriptViewer";
import { HighlightList } from "@/components/ui/HighlightList";
import {
  ArrowLeft,
  Trash2,
  ExternalLink,
  Film,
  Clock,
  User,
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
    if (result.success) {
      router.push("/episodes");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body text-content-muted">Loading episode...</p>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-body text-content-secondary">{error}</p>
        <Link
          href="/episodes"
          className="mt-3 text-meta text-accent hover:text-accent-hover"
        >
          Back to episodes
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/episodes"
        className="mb-4 inline-flex items-center gap-1.5 text-meta text-content-muted transition-colors hover:text-content-secondary"
      >
        <ArrowLeft size={14} />
        All Episodes
      </Link>

      <PageHeader
        title={episode.title}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={episode.transcript_status} />
            <button
              className="btn-secondary flex items-center gap-1.5 text-status-error hover:bg-status-error/10"
              onClick={handleDelete}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        }
      />

      {/* Episode content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main column */}
        <div className="col-span-2 space-y-6">
          {/* Thumbnail */}
          {episode.thumbnail_url && (
            <div className="panel overflow-hidden">
              <img
                src={episode.thumbnail_url}
                alt={episode.title}
                className="w-full object-cover"
                style={{ maxHeight: "360px" }}
              />
            </div>
          )}

          {/* Description */}
          {episode.description && (
            <section className="panel p-4">
              <h3 className="mb-3 text-label font-medium text-content-primary">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-body leading-relaxed text-content-secondary">
                {episode.description}
              </p>
            </section>
          )}

          {/* Transcript */}
          <TranscriptViewer
            episodeId={episode.id}
            transcriptStatus={episode.transcript_status}
          />

          {/* Highlights */}
          <HighlightList
            episodeId={episode.id}
            analysisStatus={episode.analysis_status}
            transcriptStatus={episode.transcript_status}
            onClipCreated={(clip: Clip) => router.push(`/editor/${clip.id}`)}
          />
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-6">
          {/* Metadata */}
          <section className="panel">
            <div className="border-b border-line px-4 py-3">
              <h3 className="text-label font-medium text-content-primary">
                Metadata
              </h3>
            </div>
            <div className="divide-y divide-line">
              <MetaRow
                icon={<User size={14} />}
                label="Channel"
                value={episode.channel_name ?? "Unknown"}
              />
              <MetaRow
                icon={<Clock size={14} />}
                label="Duration"
                value={
                  episode.duration_seconds
                    ? formatDuration(episode.duration_seconds)
                    : "Unknown"
                }
              />
              <MetaRow
                icon={<Film size={14} />}
                label="Source"
                value={episode.source_type}
              />
              {episode.source_url && (
                <MetaRow
                  icon={<ExternalLink size={14} />}
                  label="URL"
                  value={
                    <a
                      href={episode.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-accent hover:text-accent-hover"
                    >
                      {episode.source_url}
                    </a>
                  }
                />
              )}
            </div>
          </section>

          {/* Status */}
          <section className="panel">
            <div className="border-b border-line px-4 py-3">
              <h3 className="text-label font-medium text-content-primary">
                Pipeline Status
              </h3>
            </div>
            <div className="space-y-3 p-4">
              <StatusRow label="Transcript" status={episode.transcript_status} />
              <StatusRow label="Analysis" status={episode.analysis_status} />
            </div>
          </section>

          {/* Error */}
          {episode.error_message && (
            <section className="panel border-status-error/30">
              <div className="border-b border-line px-4 py-3">
                <h3 className="text-label font-medium text-status-error">
                  Error
                </h3>
              </div>
              <div className="p-4">
                <p className="text-body text-status-error/80">
                  {episode.error_message}
                </p>
              </div>
            </section>
          )}

          {/* Timestamps */}
          <section className="panel">
            <div className="border-b border-line px-4 py-3">
              <h3 className="text-label font-medium text-content-primary">
                Created
              </h3>
            </div>
            <div className="p-4">
              <p className="text-meta text-content-secondary">
                {new Date(episode.created_at).toLocaleString()}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-content-muted">{icon}</span>
      <span className="w-20 flex-shrink-0 text-meta text-content-muted">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-body text-content-primary">
        {value}
      </span>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body text-content-secondary">{label}</span>
      <StatusPill status={status} />
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
