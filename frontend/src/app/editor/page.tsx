import { PageHeader } from "@/components/layout/PageHeader";
import { Scissors } from "lucide-react";

export default function EditorPage() {
  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <PageHeader
        title="Clip Editor"
        description="Edit and export your clips"
      />

      {/* Editor Layout: Preview + Inspector */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main preview area */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Video preview */}
          <div className="panel flex flex-1 items-center justify-center">
            <div className="text-center">
              <Scissors size={32} className="mx-auto mb-3 text-content-muted" />
              <p className="text-body text-content-secondary">
                No clip selected
              </p>
              <p className="mt-1 text-meta text-content-muted">
                Select a clip from an episode to start editing
              </p>
            </div>
          </div>

          {/* Timeline strip */}
          <div className="panel h-24 p-4">
            <div className="flex h-full items-center justify-center rounded-control border border-dashed border-line">
              <p className="text-meta text-content-muted">
                Timeline — appears when a clip is loaded
              </p>
            </div>
          </div>
        </div>

        {/* Inspector panel */}
        <div className="panel w-72 flex-shrink-0 overflow-y-auto">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-label font-medium text-content-primary">
              Inspector
            </h3>
          </div>

          {/* Tabs placeholder */}
          <div className="flex border-b border-line">
            {["Captions", "Frame", "Grade", "Export"].map((tab) => (
              <button
                key={tab}
                className="flex-1 border-b-2 border-transparent px-3 py-2 text-meta text-content-muted transition-colors hover:text-content-secondary"
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4">
            <p className="text-meta text-content-muted">
              Select a clip to see editing controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
