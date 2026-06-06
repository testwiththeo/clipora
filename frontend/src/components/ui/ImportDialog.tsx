"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type Episode } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link2, Loader2, AlertCircle, Film } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 size={18} className="text-primary" />
            Import Episode
          </DialogTitle>
          <DialogDescription>
            Paste a YouTube URL to import a podcast episode. We'll extract metadata and download audio for processing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleImport()}
            placeholder="https://www.youtube.com/watch?v=..."
            autoFocus
            disabled={loading}
          />

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !url.trim()}>
            {loading ? (
              <><Loader2 size={14} className="mr-1.5 animate-spin" />Fetching...</>
            ) : (
              "Import"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
