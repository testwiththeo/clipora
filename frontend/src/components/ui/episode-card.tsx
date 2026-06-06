"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Film, Scissors } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Episode } from "@/lib/api";
import { cn } from "@/lib/utils";

interface EpisodeCardProps {
  episode: Episode;
  index: number;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "error" | "secondary" }> = {
  transcript_ready: { label: "Ready", variant: "success" },
  ready: { label: "Ready", variant: "success" },
  importing: { label: "Importing", variant: "warning" },
  analyzing: { label: "Analyzing", variant: "warning" },
  pending: { label: "Pending", variant: "secondary" },
  failed: { label: "Failed", variant: "error" },
};

export function EpisodeCard({ episode, index }: EpisodeCardProps) {
  const status = statusConfig[episode.transcript_status] ?? { label: episode.transcript_status, variant: "secondary" as const };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <Link
        href={`/episodes/${episode.id}`}
        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
      >
        {/* Thumbnail */}
        {episode.thumbnail_url ? (
          <img
            src={episode.thumbnail_url}
            alt=""
            className="h-16 w-28 shrink-0 rounded-lg bg-muted object-cover"
          />
        ) : (
          <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Film size={20} className="text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {episode.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {episode.channel_name ?? "Unknown channel"}
            {episode.duration_seconds && (
              <>
                {" · "}
                {formatDuration(episode.duration_seconds)}
              </>
            )}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={status.variant} className="text-[10px]">
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Arrow */}
        <div className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
