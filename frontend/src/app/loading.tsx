export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-48 rounded-control bg-app-elevated" />
          <div className="mt-2 h-4 w-72 rounded-control bg-app-elevated" />
        </div>
        <div className="h-8 w-32 rounded-control bg-app-elevated" />
      </div>

      {/* Content skeleton */}
      <div className="panel p-4 space-y-4">
        <div className="h-4 w-full rounded-control bg-app-elevated" />
        <div className="h-4 w-3/4 rounded-control bg-app-elevated" />
        <div className="h-4 w-5/6 rounded-control bg-app-elevated" />
      </div>
    </div>
  );
}
