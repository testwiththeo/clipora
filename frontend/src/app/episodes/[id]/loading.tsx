import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-8 w-96" />
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="col-span-2">
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
