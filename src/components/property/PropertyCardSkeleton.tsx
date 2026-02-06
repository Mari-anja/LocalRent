import { cn } from "@/lib/utils";

interface PropertyCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader that matches PropertyCard's exact layout.
 * Uses the shimmer animation defined in index.css.
 */
export function PropertyCardSkeleton({ className }: PropertyCardSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      {/* Image placeholder */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <div className="shimmer h-full w-full" />
        {/* Site badge */}
        <div className="absolute left-2 top-2 h-5 w-16 rounded bg-secondary">
          <div className="shimmer h-full w-full rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="h-4 w-3/4 rounded bg-muted">
            <div className="shimmer h-full w-full rounded" />
          </div>
          <div className="h-4 w-4 shrink-0 rounded bg-muted" />
        </div>

        {/* Address */}
        <div className="mb-3 h-3 w-1/2 rounded bg-muted">
          <div className="shimmer h-full w-full rounded" />
        </div>

        {/* Meta row */}
        <div className="mb-3 flex gap-3">
          <div className="h-3 w-12 rounded bg-muted">
            <div className="shimmer h-full w-full rounded" />
          </div>
          <div className="h-3 w-12 rounded bg-muted">
            <div className="shimmer h-full w-full rounded" />
          </div>
          <div className="h-3 w-14 rounded bg-muted">
            <div className="shimmer h-full w-full rounded" />
          </div>
        </div>

        {/* Price */}
        <div className="h-5 w-24 rounded bg-muted">
          <div className="shimmer h-full w-full rounded" />
        </div>
      </div>
    </div>
  );
}
