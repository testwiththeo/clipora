"use client";

import { useState, useCallback } from "react";
import { api, type Episode } from "@/lib/api";
import { Loader2, AlertCircle, Link } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: (episode: Episode) => void;
}

export function ImportDialog({ open, onClose, onImported }: ImportDialogProps) {
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
      setUrl("");
      setLoading(false);
      onClose();
    } else {
      setError(result.error?.message ?? "Import failed");
      setLoading(false);
    }
  }, [url, onImported, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleImport();
    if (e.key === "Escape") onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-overlay border border-line bg-app-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <Link size={18} className="text-accent" />
          <h2 className="text-section-title">Import Episode</h2>
        </div>

        <p className="mb-4 text-body text-content-secondary">
          Paste a YouTube URL to import a podcast episode. The system will
          extract metadata and download audio for processing.
        </p>

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://www.youtube.com/watch?v=..."
          className="input-base mb-3 w-full"
          autoFocus
          disabled={loading}
        />

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-control bg-status-error/10 px-3 py-2 text-meta text-status-error">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-primary flex items-center gap-1.5"
            onClick={handleImport}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Fetching metadata...
              </>
            ) : (
              "Import"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
