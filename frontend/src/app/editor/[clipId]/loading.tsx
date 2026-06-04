export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-24 rounded-control bg-app-elevated" />
        <div className="flex gap-2">
          <div className="h-8 w-32 rounded-control bg-app-elevated" />
          <div className="h-8 w-20 rounded-control bg-app-elevated" />
        </div>
      </div>

      <div className="flex flex-1 gap-4">
        <div className="flex flex-1 flex-col gap-4">
          <div className="panel flex flex-1 items-center justify-center">
            <div className="h-8 w-8 rounded-control bg-app-elevated" />
          </div>
          <div className="panel h-24 p-4">
            <div className="h-full rounded-control bg-app-elevated" />
          </div>
        </div>
        <div className="panel w-80">
          <div className="h-full w-full rounded-panel bg-app-elevated" />
        </div>
      </div>
    </div>
  );
}
