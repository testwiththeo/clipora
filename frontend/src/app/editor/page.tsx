"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, type Clip } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Scissors, Trash2, Download, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";

export default function ClipsListPage() {
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Clips" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Clips" description={`${total} clip${total !== 1 ? "s" : ""}`} />

      {clips.length === 0 ? (
        <EmptyState
          icon={<Scissors size={28} />}
          title="No clips yet"
          description="Import an episode on the Home page, then create clips from the AI Picks."
          action={
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {clips.map((clip, i) => {
            const startS = Math.round(clip.start_ms / 1000);
            const endS = Math.round(clip.end_ms / 1000);
            const duration = endS - startS;

            return (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                <Link
                  href={`/editor/${clip.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                >
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {clip.title ?? "Untitled clip"}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDuration(startS)} – {formatDuration(endS)}</span>
                      <span>{duration}s</span>
                      <span className="truncate">{clip.episode_id}</span>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2">
                    <StatusBadge status={clip.export_status} />

                    {clip.output_path && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const a = document.createElement("a");
                          a.href = `${API_BASE}/${clip.output_path}`;
                          a.download = "";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-success transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    )}

                    <button
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => handleDelete(clip.id, e)}
                      title="Delete clip"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "success" | "warning" | "error" | "secondary" }> = {
    draft: { label: "Draft", variant: "secondary" },
    exported: { label: "Exported", variant: "success" },
    rendering: { label: "Rendering", variant: "warning" },
    failed: { label: "Failed", variant: "error" },
  };
  const c = config[status] ?? config.draft;
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
