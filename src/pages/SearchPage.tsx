import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { SearchFilters } from "@/types";
import { useSearchResults } from "@/hooks/useSearchResults";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { SearchResultsHeader } from "@/components/search/SearchResultsHeader";
import { NoResults, ScrapeError } from "@/components/search/EmptyStates";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const filters = useMemo<SearchFilters>(
    () => ({ query: query || undefined }),
    [query]
  );
  const { phase, results, totalExpected, stats, error, retry } =
    useSearchResults(filters);

  // How many skeleton placeholders to show alongside real results
  const skeletonCount =
    phase === "loading"
      ? 6
      : phase === "partial"
        ? Math.max(0, Math.min(3, (totalExpected ?? 0) - results.length))
        : 0;

  return (
    <div>
      {/* Search bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, neighbourhood, or keyword..."
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background transition-shadow"
          />
        </div>
      </div>

      {/* Results section */}
      <section>
        <SearchResultsHeader
          phase={phase}
          resultCount={results.length}
          totalExpected={totalExpected}
          stats={stats}
        />

        {/* Error state */}
        {phase === "error" && (
          <ScrapeError message={error ?? undefined} onRetry={retry} />
        )}

        {/* Empty state */}
        {phase === "empty" && <NoResults />}

        {/* Results grid — real cards + skeleton placeholders side by side */}
        {(results.length > 0 || skeletonCount > 0) && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((scored, index) => (
              <div
                key={scored.listing.id}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{
                  animationDelay: `${Math.min(index * 50, 300)}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <PropertyCard
                  listing={scored.listing}
                  confidence={scored.confidence}
                  priceFlags={scored.priceFlags}
                />
              </div>
            ))}

            {Array.from({ length: skeletonCount }).map((_, i) => (
              <PropertyCardSkeleton key={`skel-${i}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
