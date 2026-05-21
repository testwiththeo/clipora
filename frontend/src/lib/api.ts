const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// --- Types ---

export interface Episode {
  id: string;
  source_type: string;
  source_url: string | null;
  title: string;
  channel_name: string | null;
  description: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  local_media_path: string | null;
  audio_path: string | null;
  transcript_status: string;
  analysis_status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  id: string;
  sequence_index: number;
  start_ms: number;
  end_ms: number;
  text: string;
  speaker_label: string | null;
  source_kind: string;
}

export interface HighlightCandidate {
  id: string;
  start_ms: number;
  end_ms: number;
  title: string | null;
  summary: string | null;
  score: number;
  rationale: Record<string, number | string[]> | null;
}

export interface Clip {
  id: string;
  episode_id: string;
  candidate_id: string | null;
  title: string | null;
  start_ms: number;
  end_ms: number;
  subtitle_style_json: string | null;
  framing_json: string | null;
  grade_json: string | null;
  preview_path: string | null;
  output_path: string | null;
  export_status: string;
  source_type?: string;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubtitlePreset {
  id: string;
  name: string;
  config: Record<string, unknown>;
  is_system: boolean;
}

export interface RenderJob {
  id: string;
  clip_id: string;
  job_type: string;
  status: string;
  progress: number;
  output_path: string | null;
  error_message: string | null;
  created_at: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

// --- Client ---

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return {
        success: false,
        error: body?.error ?? body?.detail?.error ?? {
          code: "REQUEST_FAILED",
          message: `HTTP ${res.status}`,
        },
      };
    }

    return res.json();
  } catch (err) {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Could not reach the server" },
    };
  }
}

export const api = {
  // Health
  health: () =>
    request<{ status: string; app: string; version: string }>("/health"),

  // Episodes
  listEpisodes: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ episodes: Episode[]; total: number }>(`/episodes${qs}`);
  },
  getEpisode: (id: string) =>
    request<Episode>(`/episodes/${id}`),
  importYouTube: (url: string) =>
    request<{ episode: Episode; status: string }>("/episodes/import/youtube", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  deleteEpisode: (id: string) =>
    request<null>(`/episodes/${id}`, { method: "DELETE" }),

  // Transcripts
  getTranscript: (episodeId: string) =>
    request<{ segments: TranscriptSegment[]; total: number }>(`/episodes/${episodeId}/transcript`),
  rebuildTranscript: (episodeId: string) =>
    request<{ status: string }>(`/episodes/${episodeId}/transcript/rebuild`, {
      method: "POST",
    }),
  whisperTranscript: (episodeId: string, model?: string) =>
    request<{ status: string }>(`/episodes/${episodeId}/transcript/whisper`, {
      method: "POST",
      body: JSON.stringify({ model: model ?? "base" }),
    }),

  // Highlights
  analyzeEpisode: (episodeId: string, minDur?: number, maxDur?: number) =>
    request<{ status: string; candidates: number }>(`/episodes/${episodeId}/analyze`, {
      method: "POST",
      body: JSON.stringify({
        target_clip_duration_min: minDur ?? 20,
        target_clip_duration_max: maxDur ?? 60,
      }),
    }),
  getHighlights: (episodeId: string) =>
    request<{ highlights: HighlightCandidate[]; total: number }>(`/episodes/${episodeId}/highlights`),

  // Clips
  listClips: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ clips: Clip[]; total: number }>(`/clips${qs}`);
  },
  createClip: (data: {
    episode_id: string;
    start_ms: number;
    end_ms: number;
    title?: string;
    candidate_id?: string;
  }) =>
    request<Clip>("/clips", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getClip: (id: string) => request<Clip>(`/clips/${id}`),
  updateClip: (id: string, data: Record<string, unknown>) =>
    request<Clip>(`/clips/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteClip: (id: string) =>
    request<null>(`/clips/${id}`, { method: "DELETE" }),

  // Preview Render
  previewRender: (clipId: string, resolution?: string) =>
    request<{ job_id: string; status: string }>(`/clips/${clipId}/preview-render`, {
      method: "POST",
      body: JSON.stringify({ resolution: resolution ?? "720x1280" }),
    }),

  // Render Jobs
  listRenderJobs: (clipId?: string) => {
    const params = clipId ? `?clip_id=${clipId}` : "";
    return request<{ jobs: RenderJob[] }>(`/render-jobs${params}`);
  },
  getRenderJob: (id: string) => request<RenderJob>(`/render-jobs/${id}`),

  // Presets
  getExportPresets: () =>
    request<{ presets: unknown[] }>("/presets/export"),
  getSubtitlePresets: () =>
    request<{ presets: SubtitlePreset[] }>("/presets/subtitles"),
  getGradingPresets: () =>
    request<{ presets: unknown[] }>("/presets/grading"),
};
