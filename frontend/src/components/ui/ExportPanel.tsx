"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type Clip, type RenderJob } from "@/lib/api";
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Film,
  History,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";

const EXPORT_PRESETS = [
  {
    id: "youtube_shorts",
    name: "YouTube Shorts",
    resolution: "1080 x 1920",
    maxDuration: "60s",
    icon: "YT",
  },
  {
    id: "tiktok",
    name: "TikTok",
    resolution: "1080 x 1920",
    maxDuration: "180s",
    icon: "TT",
  },
  {
    id: "instagram_reels",
    name: "Instagram Reels",
    resolution: "1080 x 1920",
    maxDuration: "90s",
    icon: "IG",
  },
];

interface ExportPanelProps {
  clip: Clip;
}

export function ExportPanel({ clip }: ExportPanelProps) {
  const [selectedPreset, setSelectedPreset] = useState("youtube_shorts");
  const [exporting, setExporting] = useState(false);
  const [exportJob, setExportJob] = useState<RenderJob | null>(null);
  const [history, setHistory] = useState<RenderJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch render job history
  const fetchHistory = useCallback(async () => {
    const result = await api.listRenderJobs(clip.id);
    if (result.success && result.data) {
      setHistory(result.data.jobs);
    }
  }, [clip.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    const result = await api.finalRender(clip.id, selectedPreset);

    if (result.success && result.data) {
      setExportJob({ id: result.data.job_id, status: "queued" } as RenderJob);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const jobResult = await api.getRenderJob(result.data!.job_id);
        if (jobResult.success && jobResult.data) {
          setExportJob(jobResult.data);

          if (jobResult.data.status === "completed") {
            clearInterval(pollInterval);
            setExporting(false);
            fetchHistory();
          } else if (jobResult.data.status === "failed") {
            clearInterval(pollInterval);
            setExporting(false);
            setError(jobResult.data.error_message ?? "Export failed");
            fetchHistory();
          }
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        setExporting(false);
      }, 180000);
    } else {
      setError(result.error?.message ?? "Export failed");
      setExporting(false);
    }
  };

  const hasExport = clip.export_status === "exported" && clip.output_path;

  return (
    <div className="space-y-4 p-4">
      {/* Export preset selector */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-label font-medium text-content-primary">
          <Film size={14} className="text-content-muted" />
          Export Preset
        </h4>
        <div className="space-y-1.5">
          {EXPORT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`w-full rounded-control border px-3 py-2 text-left transition-colors ${
                selectedPreset === preset.id
                  ? "border-accent bg-accent-muted/20"
                  : "border-line bg-app-elevated hover:border-content-muted hover:bg-app-hover"
              }`}
              onClick={() => setSelectedPreset(preset.id)}
              disabled={exporting}
            >
              <div className="flex items-center justify-between">
                <span className="text-body font-medium text-content-primary">
                  {preset.name}
                </span>
                <span className="rounded bg-app-hover px-1.5 py-0.5 text-[10px] font-bold text-content-muted">
                  {preset.icon}
                </span>
              </div>
              <div className="mt-0.5 flex gap-3 text-meta text-content-muted">
                <span>{preset.resolution}</span>
                <span>max {preset.maxDuration}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Export button */}
      <button
        className="btn-primary flex w-full items-center justify-center gap-1.5 py-2.5"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Exporting {exportJob?.progress ?? 0}%
          </>
        ) : (
          <>
            <Download size={15} />
            Export Clip
          </>
        )}
      </button>

      {/* Progress bar */}
      {exporting && exportJob && (
        <div className="rounded-control border border-accent/20 bg-accent-muted/10 p-3">
          <div className="mb-1.5 flex items-center justify-between text-meta">
            <span className="text-accent">Rendering export...</span>
            <span className="text-content-muted">{exportJob.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-app-elevated">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${exportJob.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-control bg-status-error/10 px-3 py-2 text-meta text-status-error">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Download section */}
      {hasExport && !exporting && (
        <div className="rounded-control border border-status-success/20 bg-status-success/5 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-meta text-status-success">
            <CheckCircle2 size={13} />
            Export ready
          </div>
          <a
            href={api.getDownloadUrl(clip.id)}
            download
            className="btn-secondary flex w-full items-center justify-center gap-1.5"
          >
            <Download size={14} />
            Download MP4
          </a>
        </div>
      )}

      {/* Render history */}
      {history.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-label font-medium text-content-primary">
            <History size={14} className="text-content-muted" />
            Render History
          </h4>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {history.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-control bg-app-elevated px-2.5 py-1.5 text-meta"
              >
                <div className="flex items-center gap-2">
                  <JobStatusIcon status={job.status} />
                  <span className="text-content-secondary">
                    {job.job_type === "preview" ? "Preview" : "Export"}
                  </span>
                </div>
                <span className="text-content-muted">
                  {job.created_at
                    ? new Date(job.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JobStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={12} className="text-status-success" />;
    case "processing":
      return <Loader2 size={12} className="animate-spin text-accent" />;
    case "failed":
      return <AlertCircle size={12} className="text-status-error" />;
    default:
      return <div className="h-2.5 w-2.5 rounded-full bg-content-muted" />;
  }
}
