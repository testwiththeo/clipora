import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure Clipora preferences and defaults"
      />

      <div className="max-w-2xl space-y-6">
        {/* General */}
        <section className="panel">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-label font-medium text-content-primary">
              General
            </h3>
          </div>
          <div className="space-y-4 p-4">
            <div>
              <label className="mb-1.5 block text-label text-content-secondary">
                Data directory
              </label>
              <input
                type="text"
                defaultValue="./data"
                className="input-base w-full"
                readOnly
              />
              <p className="mt-1 text-meta text-content-muted">
                Location where episodes, audio, and exports are stored.
              </p>
            </div>
          </div>
        </section>

        {/* Transcription */}
        <section className="panel">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-label font-medium text-content-primary">
              Transcription
            </h3>
          </div>
          <div className="space-y-4 p-4">
            <div>
              <label className="mb-1.5 block text-label text-content-secondary">
                Default Whisper model
              </label>
              <select className="input-base w-full">
                <option value="base">base</option>
                <option value="small">small</option>
                <option value="medium">medium</option>
                <option value="large">large</option>
              </select>
              <p className="mt-1 text-meta text-content-muted">
                Used when YouTube transcript retrieval fails.
              </p>
            </div>
          </div>
        </section>

        {/* Export Defaults */}
        <section className="panel">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-label font-medium text-content-primary">
              Export Defaults
            </h3>
          </div>
          <div className="space-y-4 p-4">
            <div>
              <label className="mb-1.5 block text-label text-content-secondary">
                Default platform preset
              </label>
              <select className="input-base w-full">
                <option value="youtube_shorts">YouTube Shorts</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram_reels">Instagram Reels</option>
              </select>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="panel">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-label font-medium text-content-primary">
              About
            </h3>
          </div>
          <div className="p-4">
            <dl className="space-y-2 text-body">
              <div className="flex justify-between">
                <dt className="text-content-secondary">Version</dt>
                <dd className="text-content-primary">0.1.0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-content-secondary">Backend</dt>
                <dd className="text-content-primary">FastAPI + SQLite</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-content-secondary">Frontend</dt>
                <dd className="text-content-primary">Next.js 16 + Tailwind</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="panel">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-label font-medium text-content-primary">
              Keyboard Shortcuts
            </h3>
          </div>
          <div className="divide-y divide-line">
            <ShortcutRow keys={["Space"]} description="Play / Pause preview" />
            <ShortcutRow keys={["J"]} description="Skip backward 5s" />
            <ShortcutRow keys={["L"]} description="Skip forward 5s" />
            <ShortcutRow keys={["I"]} description="Set start point at current time" />
            <ShortcutRow keys={["O"]} description="Set end point at current time" />
            <ShortcutRow keys={["⌘", "S"]} description="Save clip" />
            <ShortcutRow keys={["⌘", "Enter"]} description="Render preview" />
            <ShortcutRow keys={["Esc"]} description="Close dialog" />
          </div>
          <div className="px-4 py-2.5">
            <p className="text-meta text-content-muted">
              Shortcuts marked with ⌘ use Ctrl on Windows/Linux. Active when the editor is focused.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <span className="text-body text-content-secondary">{description}</span>
      <div className="flex gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="inline-flex min-w-[24px] items-center justify-center rounded-[5px] border border-line bg-app-elevated px-1.5 py-0.5 font-mono text-[11px] text-content-secondary"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
