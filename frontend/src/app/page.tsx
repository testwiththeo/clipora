"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link2, Loader2, Plus } from "lucide-react";
import { api, type Episode } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImportHero } from "@/components/ui/import-hero";
import { ProcessingCard } from "@/components/ui/processing-card";
import { EpisodeCard } from "@/components/ui/episode-card";
import { PageHeader } from "@/components/layout/PageHeader";

export default function HomePage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [importTitle, setImportTitle] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async () => {
    const result = await api.listEpisodes();
    if (result.success && result.data) {
      setEpisodes(result.data.episodes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  // Poll episode status when importing
  useEffect(() => {
    if (!importing || !importTitle) return;

    const interval = setInterval(async () => {
      const result = await api.listEpisodes();
      if (result.success && result.data) {
        const ep = result.data.episodes.find(
          (e) => e.title === importTitle || e.source_url === importUrl
        );
        if (ep) {
          if (ep.transcript_status === "transcript_ready" || ep.transcript_status === "ready") {
            setImporting(false);
            setImportTitle("");
            setImportUrl("");
            setEpisodes(result.data.episodes);
          } else if (ep.transcript_status === "failed") {
            setImporting(false);
            setImportError("Import failed: " + (ep.error_message ?? "Unknown error"));
            setEpisodes(result.data.episodes);
          }
          // Update step based on status
          if (ep.transcript_status === "importing") setImportStep(0);
          else if (ep.audio_path) setImportStep(1);
          else if (ep.transcript_status === "transcript_ready") setImportStep(2);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [importing, importTitle, importUrl]);

  const handleImport = async (episode: Episode) => {
    setEpisodes((prev) => [episode, ...prev]);
    setImporting(true);
    setImportTitle(episode.title);
    setImportUrl(episode.source_url ?? "");
    setImportStep(0);
  };

  const handleBarImport = async () => {
    if (!importUrl.trim()) return;
    setImportError(null);

    const result = await api.importYouTube(importUrl.trim());
    if (result.success && result.data) {
      handleImport(result.data.episode);
    } else {
      setImportError(result.error?.message ?? "Import failed");
    }
  };

  // Show processing card while importing
  if (importing) {
    return <ProcessingCard title={importTitle} step={importStep} />;
  }

  // Show hero for empty state
  if (!loading && episodes.length === 0) {
    return <ImportHero onImported={handleImport} />;
  }

  // Episode list with compact import bar
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Home"
        description={`${episodes.length} episode${episodes.length !== 1 ? "s" : ""}`}
      />

      {/* Compact import bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="Paste a YouTube URL..."
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBarImport()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleBarImport} disabled={!importUrl.trim()}>
          <Plus size={16} className="mr-1.5" />
          Import
        </Button>
      </div>

      {importError && (
        <p className="text-sm text-destructive">{importError}</p>
      )}

      {/* Episode list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {episodes.map((ep, i) => (
            <EpisodeCard key={ep.id} episode={ep} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
