"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, type Episode } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImportDialog } from "@/components/ui/ImportDialog";
import { StatusPill } from "@/components/ui/StatusPill";
import { Film, Plus, Trash2 } from "lucide-react";

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchEpisodes = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;

    const result = await api.listEpisodes(params);
    if (result.success && result.data) {
      setEpisodes(result.data.episodes);
      setTotal(result.data.total);
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const handleImported = (episode: Episode) => {
    setEpisodes((prev) => [episode, ...prev]);
    setTotal((prev) => prev + 1);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this episode?")) return;

    const result = await api.deleteEpisode(id);
    if (result.success) {
      setEpisodes((prev) => prev.filter((ep) => ep.id !== id));
      setTotal((prev) => prev - 1);
    }
  };

  return (
    <div>
      <PageHeader
        title="Episodes"
        description={`${total} episode${total !== 1 ? "s" : ""}`}
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

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search episodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base w-64"
        />
        <select
          className="input-base"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="importing">Importing</option>
          <option value="transcript_ready">Transcript Ready</option>
          <option value="analyzing">Analyzing</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Episode List */}
      <div className="panel">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 border-b border-line px-4 py-2.5 text-meta text-content-muted">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Channel</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-meta text-content-muted">
            Loading...
          </div>
        ) : episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Film size={24} className="mb-2 text-content-muted" />
            <p className="text-body text-content-secondary">
              {search || statusFilter ? "No episodes match your filters" : "No episodes imported yet"}
            </p>
            <p className="mt-0.5 text-meta text-content-muted">
              {search || statusFilter
                ? "Try adjusting your search or filter"
                : "Click Import Episode to add your first podcast"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/episodes/${ep.id}`}
                className="grid grid-cols-12 items-center gap-4 px-4 py-3 transition-colors hover:bg-app-hover"
              >
                <div className="col-span-5 min-w-0">
                  <p className="truncate text-body text-content-primary">
                    {ep.title}
                  </p>
                  <p className="truncate text-meta text-content-muted">
                    {ep.source_url}
                  </p>
                </div>
                <div className="col-span-2 truncate text-body text-content-secondary">
                  {ep.channel_name ?? "—"}
                </div>
                <div className="col-span-2 text-body text-content-secondary">
                  {ep.duration_seconds ? formatDuration(ep.duration_seconds) : "—"}
                </div>
                <div className="col-span-2">
                  <StatusPill status={ep.transcript_status} />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    className="btn-ghost p-1 text-content-muted hover:text-status-error"
                    onClick={(e) => handleDelete(ep.id, e)}
                    title="Delete episode"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
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
