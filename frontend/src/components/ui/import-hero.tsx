"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link2, Loader2, Scissors, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Episode } from "@/lib/api";

interface ImportHeroProps {
  onImported: (episode: Episode) => void;
}

const steps = [
  { icon: FileText, label: "Transcribe" },
  { icon: Scissors, label: "AI Picks" },
  { icon: Download, label: "Export" },
];

export function ImportHero({ onImported }: ImportHeroProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);

    const result = await api.importYouTube(url.trim());
    if (result.success && result.data) {
      onImported(result.data.episode);
    } else {
      setError(result.error?.message ?? "Import failed");
    }
    setLoading(false);
  }, [url, onImported]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Turn any episode into clips
          </h1>
          <p className="text-muted-foreground">
            Paste a YouTube URL and we'll find the best moments to clip, add captions, and export.
          </p>
        </div>

        {/* Import input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleImport()}
                className="pl-10 h-11"
                disabled={loading}
              />
            </div>
            <Button
              size="lg"
              onClick={handleImport}
              disabled={loading || !url.trim()}
              className="h-11 px-6"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
                <step.icon size={18} className="text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">{step.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
