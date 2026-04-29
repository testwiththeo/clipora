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
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
