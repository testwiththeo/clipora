"use client";

import { useState, useEffect } from "react";
import { api, type SubtitlePreset } from "@/lib/api";
import { Type, Loader2 } from "lucide-react";

interface SubtitleStylePanelProps {
  currentPresetId: string | null;
  onPresetChange: (presetId: string) => void;
}

export function SubtitleStylePanel({
  currentPresetId,
  onPresetChange,
}: SubtitleStylePanelProps) {
  const [presets, setPresets] = useState<SubtitlePreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPresets() {
      const result = await api.getSubtitlePresets();
      if (result.success && result.data) {
        setPresets(result.data.presets);
      }
      setLoading(false);
    }
    fetchPresets();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 size={14} className="animate-spin" />
        Loading presets...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Type size={14} className="text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">
          Subtitle Style
        </h4>
      </div>

      {/* Preset selector */}
      <div className="space-y-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors ${
              currentPresetId === preset.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted text-muted-foreground hover:border-primary/30 hover:bg-muted/80"
            }`}
            onClick={() => onPresetChange(preset.id)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{preset.name}</span>
              {preset.is_system && (
                <span className="text-[10px] text-muted-foreground uppercase">Built-in</span>
              )}
            </div>
            <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
              <span>{String(preset.config.font_name ?? "")}</span>
              <span>{String(preset.config.font_size ?? "")}px</span>
              {Boolean(preset.config.bold) && <span className="font-bold">Bold</span>}
              <span
                className="inline-block h-3 w-3 rounded-sm border border-border"
                style={{ backgroundColor: String(preset.config.primary_color ?? "#fff") }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Preview swatch */}
      {currentPresetId && (
        <div className="rounded-md border border-border bg-black/40 p-4 text-center">
          <p
            className="text-sm"
            style={{
              color: String(
                presets.find((p) => p.id === currentPresetId)?.config
                  .primary_color ?? "#fff"
              ),
              fontWeight:
                presets.find((p) => p.id === currentPresetId)?.config.bold
                  ? "bold"
                  : "normal",
              fontSize: `${Math.min(
                Number(presets.find((p) => p.id === currentPresetId)?.config
                  .font_size ?? 22),
                20
              )}px`,
              textShadow: `1px 1px 2px ${String(
                presets.find((p) => p.id === currentPresetId)?.config
                  .outline_color ?? "#000"
              )}`,
            }}
          >
            Preview subtitle text
          </p>
        </div>
      )}
    </div>
  );
}
