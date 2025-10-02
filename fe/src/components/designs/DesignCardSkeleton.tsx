import { Skeleton } from "@/components/ui/skeleton";

export function DesignCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Thumbnail skeleton */}
      <Skeleton className="w-full h-48" />

      {/* Content skeleton */}
      <div className="p-4">
        {/* Title skeleton */}
        <Skeleton className="h-5 w-3/4 mb-2" />

        {/* Date skeleton */}
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Action buttons skeleton */}
      <div className="px-4 pb-4 flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function DesignGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <DesignCardSkeleton key={index} />
      ))}
    </div>
  );
}
