"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, type Clip } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Scissors, Trash2 } from "lucide-react";

export default function EditorPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchClips = useCallback(async () => {
    const result = await api.listClips();
    if (result.success && result.data) {
      setClips(result.data.clips);
      setTotal(result.data.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this clip?")) return;

    const result = await api.deleteClip(id);
    if (result.success) {
      setClips((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
    }
  };

  return (
    <div>
      <PageHeader
        title="Clips"
        description={`${total} clip${total !== 1 ? "s" : ""}`}
      />

      {/* Clip List */}
      <div className="panel">
        <div className="grid grid-cols-12 gap-4 border-b border-line px-4 py-2.5 text-meta text-content-muted">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Episode</div>
          <div className="col-span-2">Timing</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-meta text-content-muted">
            Loading...
          </div>
        ) : clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Scissors size={24} className="mb-2 text-content-muted" />
            <p className="text-body text-content-secondary">No clips yet</p>
            <p className="mt-0.5 text-meta text-content-muted">
              Create clips from highlight candidates on an episode detail page
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {clips.map((clip) => {
              const startS = Math.round(clip.start_ms / 1000);
              const endS = Math.round(clip.end_ms / 1000);
              const duration = endS - startS;

              return (
                <Link
                  key={clip.id}
                  href={`/editor/${clip.id}`}
                  className="grid grid-cols-12 items-center gap-4 px-4 py-3 transition-colors hover:bg-app-hover"
                >
                  <div className="col-span-5 min-w-0">
                    <p className="truncate text-body text-content-primary">
                      {clip.title ?? "Untitled clip"}
                    </p>
                    <p className="truncate text-meta text-content-muted">
                      {clip.id}
                    </p>
                  </div>
                  <div className="col-span-2 truncate text-body text-content-secondary">
                    {clip.episode_id}
                  </div>
                  <div className="col-span-2 text-body text-content-secondary">
                    {formatDuration(startS)} – {formatDuration(endS)}
                    <span className="ml-2 text-meta text-content-muted">
                      ({duration}s)
                    </span>
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={clip.export_status} />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      className="btn-ghost p-1 text-content-muted hover:text-status-error"
                      onClick={(e) => handleDelete(clip.id, e)}
                      title="Delete clip"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-content-muted/10 text-content-muted",
    ready: "bg-status-success/10 text-status-success",
    rendering: "bg-accent-muted/30 text-accent",
    exported: "bg-status-success/10 text-status-success",
  };

  return (
    <span className={`status-pill ${colors[status] ?? colors.draft}`}>
      {status}
    </span>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
