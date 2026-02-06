import { SearchX, SlidersHorizontal, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  className?: string;
}

export function NoResults({ className }: EmptyStateProps) {
  return (
    <EmptyShell className={className} icon={SearchX} title="No listings found">
      <p>
        We searched across all sites but didn't find any matching rentals.
        Try broadening your search or checking a different city.
      </p>
    </EmptyShell>
  );
}

export function FiltersTooStrict({ className }: EmptyStateProps) {
  return (
    <EmptyShell
      className={className}
      icon={SlidersHorizontal}
      title="Filters too narrow"
    >
      <p>
        Your current filters don't match any listings. Try adjusting the
        price range, removing the property type filter, or searching a
        larger area.
      </p>
    </EmptyShell>
  );
}

interface ErrorStateProps extends EmptyStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ScrapeError({ className, message, onRetry }: ErrorStateProps) {
  return (
    <EmptyShell
      className={className}
      icon={AlertTriangle}
      title="Something went wrong"
    >
      <p>
        {message ??
          "We couldn't fetch listings right now. This is usually temporary."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </EmptyShell>
  );
}

// ─── Shared Shell ────────────────────────────────────────────────────────────

interface EmptyShellProps {
  className?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}

function EmptyShell({ className, icon: Icon, title, children }: EmptyShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <div className="max-w-sm text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
