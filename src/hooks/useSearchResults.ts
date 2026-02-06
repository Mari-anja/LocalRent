import { useState, useEffect, useCallback, useRef } from "react";
import type { SearchFilters } from "@/types";
import type { ScoredListing, SearchPipelineOutput } from "@/lib/search/types";
import { runSearchPipeline } from "@/lib/search/pipeline";
import { MOCK_LISTINGS } from "@/data/mock-listings";

// ─── State Machine ───────────────────────────────────────────────────────────

export type SearchPhase =
  | "idle"       // No search started
  | "loading"    // Waiting for first results
  | "partial"    // Some results in, more coming
  | "complete"   // All results loaded
  | "empty"      // Search completed, zero results
  | "error";     // Something went wrong

export interface SearchResultsState {
  phase: SearchPhase;
  /** Results available so far (may be partial). */
  results: ScoredListing[];
  /** Total results expected (null if unknown yet). */
  totalExpected: number | null;
  /** Pipeline stats (available once at least one batch is processed). */
  stats: Pick<SearchPipelineOutput, "duplicatesRemoved" | "priceFlagged" | "dataFlagged" | "processingTimeMs"> | null;
  /** Error message if phase is "error". */
  error: string | null;
}

const INITIAL_STATE: SearchResultsState = {
  phase: "idle",
  results: [],
  totalExpected: null,
  stats: null,
  error: null,
};

// ─── Simulated Progressive Loading ───────────────────────────────────────────

/**
 * Simulates the real-world behavior where scrape responses arrive
 * in batches (one per site). Each batch is processed through the
 * ranking pipeline and merged into the running result set.
 *
 * Timing:
 *  - Batch 1: 600ms  (fast first paint)
 *  - Batch 2: 1400ms (second site responds)
 *  - Batch 3: 2200ms (third site, all done)
 */
const BATCH_DELAYS = [600, 1400, 2200];

function splitIntoBatches(total: number, batchCount: number): number[] {
  const sizes: number[] = [];
  const base = Math.floor(total / batchCount);
  let remainder = total - base * batchCount;
  for (let i = 0; i < batchCount; i++) {
    sizes.push(base + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder--;
  }
  return sizes;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSearchResults(filters: SearchFilters) {
  const [state, setState] = useState<SearchResultsState>(INITIAL_STATE);
  const abortRef = useRef<boolean>(false);

  const executeSearch = useCallback(
    (searchFilters: SearchFilters) => {
      abortRef.current = false;

      setState({
        phase: "loading",
        results: [],
        totalExpected: null,
        stats: null,
        error: null,
      });

      // Determine which mock listings match the country/city filters.
      let pool = [...MOCK_LISTINGS];
      if (searchFilters.countryId) {
        pool = pool.filter((l) => l.countryId === searchFilters.countryId);
      }
      if (searchFilters.cityId) {
        pool = pool.filter((l) => l.cityId === searchFilters.cityId);
      }

      const batchSizes = splitIntoBatches(pool.length, BATCH_DELAYS.length);
      let cursor = 0;
      let accumulated: typeof pool = [];

      batchSizes.forEach((size, batchIndex) => {
        const batchListings = pool.slice(cursor, cursor + size);
        cursor += size;

        setTimeout(() => {
          if (abortRef.current) return;

          accumulated = [...accumulated, ...batchListings];

          // Run the full pipeline on all accumulated results.
          const output = runSearchPipeline({
            listings: accumulated,
            filters: searchFilters,
          });

          const isLast = batchIndex === BATCH_DELAYS.length - 1;
          const hasResults = output.results.length > 0;

          setState({
            phase: isLast
              ? hasResults
                ? "complete"
                : "empty"
              : "partial",
            results: output.results,
            totalExpected: pool.length,
            stats: {
              duplicatesRemoved: output.duplicatesRemoved,
              priceFlagged: output.priceFlagged,
              dataFlagged: output.dataFlagged,
              processingTimeMs: output.processingTimeMs,
            },
            error: null,
          });
        }, BATCH_DELAYS[batchIndex]);
      });
    },
    []
  );

  // Auto-search on mount and when filters change.
  useEffect(() => {
    executeSearch(filters);
    return () => {
      abortRef.current = true;
    };
  }, [filters, executeSearch]);

  const retry = useCallback(() => {
    executeSearch(filters);
  }, [filters, executeSearch]);

  return { ...state, retry };
}
