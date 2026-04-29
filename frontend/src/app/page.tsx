"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, type Episode } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImportDialog } from "@/components/ui/ImportDialog";
import { StatusPill } from "@/components/ui/StatusPill";
import { Film, Scissors, Plus } from "lucide-react";

export default function DashboardPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const fetchEpisodes = useCallback(async () => {
    const result = await api.listEpisodes({ limit: "5" });
    if (result.success && result.data) {
      setEpisodes(result.data.episodes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const handleImported = (episode: Episode) => {
    setEpisodes((prev) => [episode, ...prev]);
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Quick overview of your recent work"
        actions={
          <button
            className="btn-primary flex items-center gap-1.5"
            onClick={() => setImportOpen(true)}
          >
            <Plus size={14} />
            Import Episode
          </button>
        }
      />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={handleImported}
      />

      <div className="space-y-6">
        {/* Recent Episodes */}
        <section className="panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-label font-medium text-content-primary">
              Recent Episodes
            </h3>
            <Link
              href="/episodes"
              className="text-meta text-accent hover:text-accent-hover transition-colors"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-meta text-content-muted">
              Loading...
            </div>
          ) : episodes.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<Film size={20} />}
                message="No episodes yet"
                hint="Import your first podcast episode to get started"
              />
            </div>
          ) : (
            <div className="divide-y divide-line">
              {episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/episodes/${ep.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-app-hover"
                >
                  {/* Thumbnail */}
                  {ep.thumbnail_url ? (
                    <img
                      src={ep.thumbnail_url}
                      alt=""
                      className="h-10 w-16 flex-shrink-0 rounded-control bg-app-elevated object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-16 flex-shrink-0 items-center justify-center rounded-control bg-app-elevated text-content-muted">
                      <Film size={14} />
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body text-content-primary">
                      {ep.title}
                    </p>
                    <p className="truncate text-meta text-content-muted">
                      {ep.channel_name ?? "Unknown channel"}
                      {ep.duration_seconds
                        ? ` · ${formatDuration(ep.duration_seconds)}`
                        : ""}
                    </p>
                  </div>

                  <StatusPill status={ep.transcript_status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Clips */}
        <section className="panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-label font-medium text-content-primary">
              Recent Clips
            </h3>
            <Link
              href="/editor"
              className="text-meta text-accent hover:text-accent-hover transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="p-4">
            <EmptyState
              icon={<Scissors size={20} />}
              message="No clips yet"
              hint="Create clips from episode highlights"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  message,
  hint,
}: {
  icon: React.ReactNode;
  message: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-2 text-content-muted">{icon}</div>
      <p className="text-body text-content-secondary">{message}</p>
      <p className="mt-0.5 text-meta text-content-muted">{hint}</p>
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
