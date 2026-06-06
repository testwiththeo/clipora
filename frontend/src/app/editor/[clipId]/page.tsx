"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, type Clip, type Episode, type RenderJob, type GradingConfig } from "@/lib/api";
import { SubtitleStylePanel } from "@/components/ui/SubtitleStylePanel";
import { ColorGradeControls } from "@/components/ui/ColorGradeControls";
import { ExportPanel } from "@/components/ui/ExportPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
  Download,
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

  const [startMs, setStartMs] = useState(0);
  const [endMs, setEndMs] = useState(0);
  const [title, setTitle] = useState("");
  const [subtitlePresetId, setSubtitlePresetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [gradeConfig, setGradeConfig] = useState<GradingConfig | null>(null);
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

      if (result.data.subtitle_style_json) {
        try {
          const style = JSON.parse(result.data.subtitle_style_json);
          if (style.preset) setSubtitlePresetId(style.preset);
        } catch {}
      }
      if (result.data.grade_json) {
        try { setGradeConfig(JSON.parse(result.data.grade_json)); } catch {}
      }
      if (result.data.preview_path) {
        setPreviewUrl(`${API_BASE}/${result.data.preview_path}`);
      }

      const epResult = await api.getEpisode(result.data.episode_id);
      if (epResult.success && epResult.data) {
        setEpisode(epResult.data);
      }
    } else {
      setError(result.error?.message ?? "Clip not found");
    }
    setLoading(false);
  }, [clipId]);

  useEffect(() => { fetchClip(); }, [fetchClip]);

  const handleSave = async () => {
    setSaving(true);
    const result = await api.updateClip(clipId, { start_ms: startMs, end_ms: endMs, title });
    if (result.success && result.data) setClip(result.data);
    setSaving(false);
  };

  const handleSubtitlePresetChange = async (presetId: string) => {
    setSubtitlePresetId(presetId);
    await api.updateClip(clipId, { subtitle_style: { preset: presetId } });
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
      const pollInterval = setInterval(async () => {
        const jobResult = await api.getRenderJob(result.data!.job_id);
        if (jobResult.success && jobResult.data) {
          setRenderJob(jobResult.data);
          if (jobResult.data.status === "completed") {
            clearInterval(pollInterval);
            setRendering(false);
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
      setTimeout(() => { clearInterval(pollInterval); setRendering(false); }, 120000);
    } else {
      setError(result.error?.message ?? "Failed to start render");
      setRendering(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause(); else videoRef.current.play();
    setPlaying(!playing);
  };

  const seekTo = (ms: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = ms / 1000;
    setCurrentTime(ms);
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 h-[calc(100vh-10rem)]">
          <Skeleton className="flex-1 rounded-xl" />
          <Skeleton className="w-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && !clip) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={28} className="mb-3 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="link" asChild className="mt-3">
          <Link href="/editor">Back to clips</Link>
        </Button>
      </div>
    );
  }

  if (!clip) return null;

  const clipDurationS = (endMs - startMs) / 1000;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/editor">
            <ArrowLeft size={14} className="mr-1.5" />
            All Clips
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewRender}
            disabled={rendering}
          >
            {rendering ? (
              <><Loader2 size={14} className="mr-1.5 animate-spin" />Rendering {renderJob?.progress ?? 0}%</>
            ) : (
              <><MonitorPlay size={14} className="mr-1.5" />{previewUrl ? "Re-render" : "Preview"}</>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
            Save
          </Button>

          <Button size="sm" className="bg-primary" asChild>
            <Link href={`/editor/${clipId}?export=true`}>
              <Download size={14} className="mr-1.5" />
              Export
            </Link>
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive"
        >
          <AlertCircle size={15} />
          {error}
        </motion.div>
      )}

      {/* Render progress */}
      {rendering && renderJob && (
        <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-primary font-medium">Rendering preview...</span>
            <span className="text-muted-foreground">{renderJob.progress}%</span>
          </div>
          <Progress value={renderJob.progress} className="h-1.5" />
        </div>
      )}

      {/* Editor Layout */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main area */}
        <div className="flex flex-[65%] flex-col gap-4">
          {/* Video Preview */}
          <div className="flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
            {previewUrl ? (
              <video
                ref={videoRef}
                src={previewUrl}
                className="h-full w-full object-contain"
                controls
                preload="metadata"
                onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime * 1000)}
                onEnded={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            ) : (
              <div className="text-center space-y-2">
                <MonitorPlay size={32} className="mx-auto text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">{clip.title ?? "Untitled clip"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMs(startMs)} – {formatMs(endMs)} ({clipDurationS.toFixed(1)}s)
                </p>
                <p className="text-xs text-muted-foreground">Click &quot;Preview&quot; to generate a preview with captions</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">Timeline</h3>
              <span className="font-mono text-xs text-muted-foreground">
                {formatMs(currentTime)} / {formatMs(endMs)}
              </span>
            </div>

            {previewUrl && (
              <div className="mb-3 flex items-center justify-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => seekTo(startMs)} title="Jump to start">
                  <SkipBack size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={togglePlay} className="px-6">
                  {playing ? <><Pause size={14} className="mr-1.5" />Pause</> : <><Play size={14} className="mr-1.5" />Play</>}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => seekTo(endMs)} title="Jump to end">
                  <SkipForward size={16} />
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Start (ms)</label>
                <Input
                  type="number"
                  value={startMs}
                  onChange={(e) => setStartMs(Number(e.target.value))}
                  className="font-mono text-xs"
                  min={0}
                  step={100}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">End (ms)</label>
                <Input
                  type="number"
                  value={endMs}
                  onChange={(e) => setEndMs(Number(e.target.value))}
                  className="font-mono text-xs"
                  min={startMs + 1000}
                  step={100}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="w-[35%] min-w-[280px] flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Title + meta */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Clip title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Duration</span>
                    <p className="text-sm font-medium">{clipDurationS.toFixed(1)}s</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Status</span>
                    <div className="mt-0.5">
                      <Badge variant="secondary">{clip.export_status}</Badge>
                    </div>
                  </div>
                </div>
                {previewUrl && (
                  <div className="flex items-center gap-1.5 text-xs text-success">
                    <CheckCircle2 size={13} />
                    Preview ready
                  </div>
                )}
              </div>

              <Separator />

              {/* Tab buttons */}
              <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                {["Style", "Color"].map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      i === activeTab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 0 && (
                <SubtitleStylePanel
                  currentPresetId={subtitlePresetId}
                  onPresetChange={handleSubtitlePresetChange}
                />
              )}
              {activeTab === 1 && (
                <ColorGradeControls
                  currentGrade={gradeConfig}
                  onGradeChange={handleGradeChange}
                />
              )}
            </div>
          </ScrollArea>
        </div>
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
