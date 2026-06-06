import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <Skeleton className="h-10 w-64 rounded-md" />
      <div className="rounded-xl border border-border">
        <div className="border-b border-border px-4 py-2.5">
          <Skeleton className="h-3 w-full" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
