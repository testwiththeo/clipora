"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type GradingPreset, type GradingConfig } from "@/lib/api";
import { Palette, Loader2, RotateCcw, Save } from "lucide-react";

const DEFAULT_CONFIG: GradingConfig = {
  brightness: 0,
  contrast: 1,
  saturation: 1,
  temperature: 0,
};

interface ColorGradeControlsProps {
  currentGrade: GradingConfig | null;
  onGradeChange: (grade: GradingConfig) => void;
}

export function ColorGradeControls({
  currentGrade,
  onGradeChange,
}: ColorGradeControlsProps) {
  const [presets, setPresets] = useState<GradingPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePresetId, setActivePresetId] = useState<string>("none");
  const [config, setConfig] = useState<GradingConfig>(
    currentGrade ?? { ...DEFAULT_CONFIG }
  );
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPresets() {
      const result = await api.getGradingPresets();
      if (result.success && result.data) {
        setPresets(result.data.presets);
      }
      setLoading(false);
    }
    fetchPresets();
  }, []);

  // Sync from external changes
  useEffect(() => {
    if (currentGrade) {
      setConfig(currentGrade);
      if (currentGrade.preset) {
        setActivePresetId(currentGrade.preset);
      }
    }
  }, [currentGrade]);

  const handlePresetSelect = (presetId: string) => {
    setActivePresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      const newConfig: GradingConfig = {
        preset: presetId,
        ...preset.config,
      };
      setConfig(newConfig);
      onGradeChange(newConfig);
    }
  };

  const handleSliderChange = (key: keyof GradingConfig, value: number) => {
    const newConfig = { ...config, [key]: value, preset: undefined };
    setConfig(newConfig);
    setActivePresetId("");
  };

  const handleSliderCommit = () => {
    onGradeChange(config);
  };

  const handleReset = () => {
    const resetConfig: GradingConfig = { ...DEFAULT_CONFIG, preset: "none" };
    setConfig(resetConfig);
    setActivePresetId("none");
    onGradeChange(resetConfig);
  };

  const handleSavePreset = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    const result = await api.saveGradingPreset(saveName.trim(), config);
    if (result.success && result.data) {
      setPresets((prev) => [...prev, result.data!]);
      setSaveName("");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-meta text-content-muted">
        <Loader2 size={14} className="animate-spin" />
        Loading presets...
      </div>
    );
  }

  const hasChanges =
    config.brightness !== DEFAULT_CONFIG.brightness ||
    config.contrast !== DEFAULT_CONFIG.contrast ||
    config.saturation !== DEFAULT_CONFIG.saturation ||
    config.temperature !== DEFAULT_CONFIG.temperature;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-content-muted" />
          <h4 className="text-label font-medium text-content-primary">
            Color Grading
          </h4>
        </div>
        {hasChanges && (
          <button
            className="btn-ghost p-1 text-content-muted hover:text-content-primary"
            onClick={handleReset}
            title="Reset to default"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {/* Preset selector */}
      <div className="grid grid-cols-2 gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className={`rounded-control border px-2.5 py-1.5 text-left transition-colors ${
              activePresetId === preset.id
                ? "border-accent bg-accent-muted/20 text-content-primary"
                : "border-line bg-app-elevated text-content-secondary hover:border-content-muted hover:bg-app-hover"
            }`}
            onClick={() => handlePresetSelect(preset.id)}
          >
            <span className="text-meta font-medium">{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        <SliderControl
          label="Brightness"
          value={config.brightness}
          min={-0.15}
          max={0.15}
          step={0.01}
          displayValue={`${config.brightness >= 0 ? "+" : ""}${(config.brightness * 100).toFixed(0)}%`}
          onChange={(v) => handleSliderChange("brightness", v)}
          onCommit={handleSliderCommit}
        />
        <SliderControl
          label="Contrast"
          value={config.contrast}
          min={0.7}
          max={1.4}
          step={0.01}
          displayValue={`${((config.contrast - 1) * 100).toFixed(0)}%`}
          onChange={(v) => handleSliderChange("contrast", v)}
          onCommit={handleSliderCommit}
        />
        <SliderControl
          label="Saturation"
          value={config.saturation}
          min={0.5}
          max={1.5}
          step={0.01}
          displayValue={`${((config.saturation - 1) * 100).toFixed(0)}%`}
          onChange={(v) => handleSliderChange("saturation", v)}
          onCommit={handleSliderCommit}
        />
        <SliderControl
          label="Temperature"
          value={config.temperature}
          min={-0.15}
          max={0.15}
          step={0.01}
          displayValue={
            config.temperature > 0.01
              ? "Warm"
              : config.temperature < -0.01
                ? "Cool"
                : "Neutral"
          }
          onChange={(v) => handleSliderChange("temperature", v)}
          onCommit={handleSliderCommit}
        />
      </div>

      {/* Save custom preset */}
      {hasChanges && (
        <div className="flex gap-2 border-t border-line pt-3">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Preset name..."
            className="input-base flex-1 text-meta"
          />
          <button
            className="btn-secondary flex items-center gap-1"
            onClick={handleSavePreset}
            disabled={!saveName.trim() || saving}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-meta text-content-secondary">{label}</span>
        <span className="font-mono text-meta text-content-muted">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="w-full accent-accent"
      />
    </div>
  );
}
