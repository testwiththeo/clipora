"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const shortcuts = [
  { keys: ["Space"], description: "Play / Pause preview" },
  { keys: ["J"], description: "Skip backward 5s" },
  { keys: ["L"], description: "Skip forward 5s" },
  { keys: ["I"], description: "Set start point at current time" },
  { keys: ["O"], description: "Set end point at current time" },
  { keys: ["⌘", "S"], description: "Save clip" },
  { keys: ["⌘", "B"], description: "Toggle sidebar" },
  { keys: ["Esc"], description: "Close dialog" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Settings"
        description="Configure Clipora preferences and defaults"
      />

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Theme</label>
              {mounted && (
                <div className="mt-2 flex gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
                        theme === opt.value
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      <opt.icon size={16} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* General */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Data directory</label>
              <p className="mt-1 text-sm font-mono text-foreground">./data</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Where episodes, audio, and exports are stored.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transcription */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Default Whisper model</label>
              <div className="mt-2 flex gap-2">
                {["base", "small", "medium", "large"].map((model) => (
                  <button
                    key={model}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      model === "base"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {model}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Used when YouTube transcript retrieval fails.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Defaults */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Export Defaults</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm text-muted-foreground">Default platform</label>
              <div className="mt-2 flex gap-2">
                {[
                  { id: "youtube_shorts", label: "YouTube Shorts" },
                  { id: "tiktok", label: "TikTok" },
                  { id: "instagram_reels", label: "Instagram Reels" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      preset.id === "youtube_shorts"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Keyboard Shortcuts */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.description} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Shortcuts marked with ⌘ use Ctrl on Windows/Linux. Active when the editor is focused.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2.5 text-sm">
              {[
                ["Version", "0.1.0"],
                ["Backend", "FastAPI + SQLite"],
                ["Frontend", "Next.js 16 + Tailwind CSS"],
                ["UI", "shadcn/ui + Framer Motion"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
