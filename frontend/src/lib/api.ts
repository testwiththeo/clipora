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
  getHighlights: (episodeId: string) =>
    request<{ highlights: unknown[] }>(`/episodes/${episodeId}/highlights`),

  // Clips
  createClip: (data: Record<string, unknown>) =>
    request<{ clip_id: string }>("/clips", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getClip: (id: string) => request<unknown>(`/clips/${id}`),
  updateClip: (id: string, data: Record<string, unknown>) =>
    request<unknown>(`/clips/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Renders
  listRenderJobs: () => request<{ jobs: unknown[] }>("/render-jobs"),
  getRenderJob: (id: string) => request<unknown>(`/render-jobs/${id}`),

  // Presets
  getExportPresets: () =>
    request<{ presets: unknown[] }>("/presets/export"),
  getSubtitlePresets: () =>
    request<{ presets: unknown[] }>("/presets/subtitles"),
  getGradingPresets: () =>
    request<{ presets: unknown[] }>("/presets/grading"),
};
