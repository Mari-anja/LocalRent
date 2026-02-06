import { Loader2 } from "lucide-react";
import type { SearchPhase } from "@/hooks/useSearchResults";
import type { SearchPipelineOutput } from "@/lib/search/types";

interface SearchResultsHeaderProps {
  phase: SearchPhase;
  resultCount: number;
  totalExpected: number | null;
  stats: Pick<
    SearchPipelineOutput,
    "duplicatesRemoved" | "priceFlagged" | "dataFlagged" | "processingTimeMs"
  > | null;
}

export function SearchResultsHeader({
  phase,
  resultCount,
  totalExpected,
  stats,
}: SearchResultsHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Listings</h2>

        {phase === "loading" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching...
          </span>
        )}

        {phase === "partial" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {resultCount} found
            {totalExpected !== null && ` of ~${totalExpected}`}
          </span>
        )}

        {phase === "complete" && (
          <span className="text-sm text-muted-foreground">
            {resultCount} result{resultCount !== 1 ? "s" : ""}
          </span>
        )}

        {phase === "empty" && (
          <span className="text-sm text-muted-foreground">0 results</span>
        )}
      </div>

      {stats && phase !== "loading" && stats.duplicatesRemoved > 0 && (
        <span className="text-xs text-muted-foreground">
          {stats.duplicatesRemoved} duplicate
          {stats.duplicatesRemoved !== 1 ? "s" : ""} removed
        </span>
      )}
    </div>
  );
}
