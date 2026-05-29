"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type Clip, type Episode, type RenderJob, type GradingConfig } from "@/lib/api";
import { SubtitleStylePanel } from "@/components/ui/SubtitleStylePanel";
import { ExportPanel } from "@/components/ui/ExportPanel";
import { ColorGradeControls } from "@/components/ui/ColorGradeControls";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Save,
  Loader2,
  MonitorPlay,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";

export default function ClipEditorPage() {
  const params = useParams();
  const clipId = params.clipId as string;

  const [clip, setClip] = useState<Clip | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Editable fields
  const [startMs, setStartMs] = useState(0);
  const [endMs, setEndMs] = useState(0);
  const [title, setTitle] = useState("");
  const [subtitlePresetId, setSubtitlePresetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Grading state
  const [gradeConfig, setGradeConfig] = useState<GradingConfig | null>(null);

  // Render state
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [rendering, setRendering] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchClip = useCallback(async () => {
    const result = await api.getClip(clipId);
    if (result.success && result.data) {
      setClip(result.data);
      setStartMs(result.data.start_ms);
      setEndMs(result.data.end_ms);
      setTitle(result.data.title ?? "");

      // Parse subtitle preset from stored style
      if (result.data.subtitle_style_json) {
        try {
          const style = JSON.parse(result.data.subtitle_style_json);
          if (style.preset) setSubtitlePresetId(style.preset);
        } catch {}
      }

      // Parse grading config from stored grade
      if (result.data.grade_json) {
        try {
          setGradeConfig(JSON.parse(result.data.grade_json));
        } catch {}
      }

      // Check for existing preview
      if (result.data.preview_path) {
        setPreviewUrl(`${API_BASE}/${result.data.preview_path}`);
      }

      // Fetch episode for video URL
      const epResult = await api.getEpisode(result.data.episode_id);
      if (epResult.success && epResult.data) {
        setEpisode(epResult.data);
      }
    } else {
      setError(result.error?.message ?? "Clip not found");
    }
    setLoading(false);
  }, [clipId]);

  useEffect(() => {
    fetchClip();
  }, [fetchClip]);

  const handleSave = async () => {
    setSaving(true);
    const result = await api.updateClip(clipId, {
      start_ms: startMs,
      end_ms: endMs,
      title: title,
    });
    if (result.success && result.data) {
      setClip(result.data);
    }
    setSaving(false);
  };

  const handleSubtitlePresetChange = async (presetId: string) => {
    setSubtitlePresetId(presetId);
    await api.updateClip(clipId, {
      subtitle_style: { preset: presetId },
    });
  };

  const handleGradeChange = async (grade: GradingConfig) => {
    setGradeConfig(grade);
    await api.updateClip(clipId, { grade });
  };

  const handlePreviewRender = async () => {
    setRendering(true);
    setError(null);

    const result = await api.previewRender(clipId);

    if (result.success && result.data) {
      setRenderJob({ id: result.data.job_id, status: "queued" } as RenderJob);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const jobResult = await api.getRenderJob(result.data!.job_id);
        if (jobResult.success && jobResult.data) {
          setRenderJob(jobResult.data);

          if (jobResult.data.status === "completed") {
            clearInterval(pollInterval);
            setRendering(false);
            // Refresh clip to get preview path
            const refreshResult = await api.getClip(clipId);
            if (refreshResult.success && refreshResult.data?.preview_path) {
              setPreviewUrl(`${API_BASE}/${refreshResult.data.preview_path}`);
            }
          } else if (jobResult.data.status === "failed") {
            clearInterval(pollInterval);
            setRendering(false);
            setError(jobResult.data.error_message ?? "Render failed");
          }
        }
      }, 2000);

      // Safety timeout: stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setRendering(false);
      }, 120000);
    } else {
      setError(result.error?.message ?? "Failed to start render");
      setRendering(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const seekTo = (ms: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = ms / 1000;
    setCurrentTime(ms);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime * 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body text-content-muted">Loading clip...</p>
      </div>
    );
  }

  if (error && !clip) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-body text-content-secondary">{error}</p>
        <Link href="/editor" className="mt-3 text-meta text-accent hover:text-accent-hover">
          Back to clips
        </Link>
      </div>
    );
  }

  if (!clip) return null;

  const clipDurationS = (endMs - startMs) / 1000;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/editor"
          className="inline-flex items-center gap-1.5 text-meta text-content-muted transition-colors hover:text-content-secondary"
        >
          <ArrowLeft size={14} />
          All Clips
        </Link>

        <div className="flex items-center gap-2">
          <button
            className="btn-secondary flex items-center gap-1.5"
            onClick={handlePreviewRender}
            disabled={rendering}
          >
            {rendering ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MonitorPlay size={14} />
            )}
            {rendering
              ? `Rendering ${renderJob?.progress ?? 0}%`
              : previewUrl
                ? "Re-render Preview"
                : "Render Preview"}
          </button>
          <button
            className="btn-primary flex items-center gap-1.5"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-control border border-status-error/30 bg-status-error/5 px-4 py-2 text-body text-status-error">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Render progress */}
      {rendering && renderJob && (
        <div className="mb-3 rounded-control border border-accent/20 bg-accent-muted/10 px-4 py-2">
          <div className="mb-1 flex items-center justify-between text-meta">
            <span className="text-accent">Rendering preview...</span>
            <span className="text-content-muted">{renderJob.progress}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-app-elevated">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${renderJob.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Editor Layout */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main area: Preview + Timeline */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Video Preview */}
          <div className="panel flex flex-1 items-center justify-center overflow-hidden">
            {previewUrl ? (
              <video
                ref={videoRef}
                src={previewUrl}
                className="h-full w-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            ) : (
              <div className="text-center">
                <MonitorPlay size={32} className="mx-auto mb-3 text-content-muted" />
                <p className="text-body text-content-secondary">
                  {clip.title ?? "Untitled clip"}
                </p>
                <p className="mt-1 text-meta text-content-muted">
                  {formatMs(startMs)} – {formatMs(endMs)} ({clipDurationS.toFixed(1)}s)
                </p>
                <p className="mt-3 text-meta text-content-muted">
                  Click &quot;Render Preview&quot; to generate a preview with subtitles
                </p>
              </div>
            )}
          </div>

          {/* Timeline Strip */}
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-label font-medium text-content-primary">
                Timeline
              </h3>
              <span className="font-mono text-meta text-content-muted">
                {formatMs(currentTime)} / {formatMs(endMs)}
              </span>
            </div>

            {/* Playback controls */}
            {previewUrl && (
              <div className="mb-3 flex items-center justify-center gap-2">
                <button
                  className="btn-ghost p-1.5"
                  onClick={() => seekTo(startMs)}
                  title="Jump to start"
                >
                  <SkipBack size={16} />
                </button>
                <button
                  className="btn-secondary flex items-center gap-1 px-4 py-1.5"
                  onClick={togglePlay}
                >
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  className="btn-ghost p-1.5"
                  onClick={() => seekTo(endMs)}
                  title="Jump to end"
                >
                  <SkipForward size={16} />
                </button>
              </div>
            )}

            {/* Start/End controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-meta text-content-muted">
                  Start (ms)
                </label>
                <input
                  type="number"
                  value={startMs}
                  onChange={(e) => setStartMs(Number(e.target.value))}
                  className="input-base w-full font-mono text-meta"
                  min={0}
                  step={100}
                />
              </div>
              <div>
                <label className="mb-1 block text-meta text-content-muted">
                  End (ms)
                </label>
                <input
                  type="number"
                  value={endMs}
                  onChange={(e) => setEndMs(Number(e.target.value))}
                  className="input-base w-full font-mono text-meta"
                  min={startMs + 1000}
                  step={100}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="panel w-80 flex-shrink-0 overflow-y-auto">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-label font-medium text-content-primary">
              Inspector
            </h3>
          </div>

          {/* Tabs */}
          <InspectorTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Details section (always visible) */}
          <div className="space-y-4 border-b border-line p-4">
            <div>
              <label className="mb-1.5 block text-label text-content-secondary">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-base w-full"
                placeholder="Clip title"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-meta text-content-muted">Duration</label>
                <p className="text-body text-content-primary">
                  {clipDurationS.toFixed(1)}s
                </p>
              </div>
              <div>
                <label className="mb-1 block text-meta text-content-muted">Status</label>
                <span className="status-pill bg-content-muted/10 text-content-muted">
                  {clip.export_status}
                </span>
              </div>
            </div>

            {previewUrl && (
              <div className="flex items-center gap-1.5 text-meta text-status-success">
                <CheckCircle2 size={13} />
                Preview rendered
              </div>
            )}
          </div>

          {/* Tab content */}
          {activeTab === 0 && (
            <SubtitleStylePanel
              currentPresetId={subtitlePresetId}
              onPresetChange={handleSubtitlePresetChange}
            />
          )}
          {activeTab === 1 && (
            <div className="p-4 text-meta text-content-muted">
              <p>Framing controls (aspect ratio, crop mode) will be available in a future sprint.</p>
            </div>
          )}
          {activeTab === 2 && (
            <ColorGradeControls
              currentGrade={gradeConfig}
              onGradeChange={handleGradeChange}
            />
          )}
          {activeTab === 3 && <ExportPanel clip={clip} />}
        </div>
      </div>
    </div>
  );
}

function InspectorTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: number;
  onTabChange: (tab: number) => void;
}) {
  const tabs = ["Captions", "Frame", "Grade", "Export"];

  return (
    <div className="flex border-b border-line">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          className={`flex-1 border-b-2 px-3 py-2 text-meta transition-colors ${
            i === activeTab
              ? "border-accent text-content-primary font-medium"
              : "border-transparent text-content-muted hover:text-content-secondary"
          }`}
          onClick={() => onTabChange(i)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
