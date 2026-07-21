import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <Skeleton className="h-9 w-72" />

      <div className="rounded-xl border overflow-hidden">
        <div className="bg-gray-50/70 px-4 py-3 flex gap-6 border-b">
          {["w-10", "w-24", "w-28", "w-20", "w-16"].map((w, i) => (
            <Skeleton key={i} className={`h-4 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-14 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}