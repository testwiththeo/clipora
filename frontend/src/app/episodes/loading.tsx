export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-36 rounded-control bg-app-elevated" />
          <div className="mt-2 h-4 w-24 rounded-control bg-app-elevated" />
        </div>
        <div className="h-8 w-36 rounded-control bg-app-elevated" />
      </div>

      {/* Filter skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-64 rounded-control bg-app-elevated" />
        <div className="h-9 w-32 rounded-control bg-app-elevated" />
      </div>

      {/* Table skeleton */}
      <div className="panel">
        <div className="border-b border-line px-4 py-2.5">
          <div className="h-3 w-full rounded-control bg-app-elevated" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3">
            <div className="h-4 w-2/5 rounded-control bg-app-elevated" />
            <div className="h-4 w-1/6 rounded-control bg-app-elevated" />
            <div className="h-4 w-1/6 rounded-control bg-app-elevated" />
            <div className="h-5 w-20 rounded-full bg-app-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
