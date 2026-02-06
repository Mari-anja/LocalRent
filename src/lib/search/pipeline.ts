import type { RentalListing } from "@/types";
import type {
  ScoredListing,
  SearchPipelineInput,
  SearchPipelineOutput,
  RankingWeights,
} from "./types";
import { DEFAULT_WEIGHTS } from "./types";
import {
  normalizeTitle,
  normalizeAddress,
  deduplicateListings,
  flagPrice,
  flagData,
  median,
  buildTitleCounts,
} from "./normalize";
import { computeConfidence, computeKeywordRelevance } from "./score";
import { computeRankScore, sortByRank } from "./rank";

// ─── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Full search orchestration pipeline.
 *
 * Takes raw scraped listings and produces a ranked, scored, deduplicated
 * list ready for the UI.
 *
 * Pipeline stages (order matters):
 *  1. Normalize   — clean titles, addresses
 *  2. Deduplicate — cross-source dedup by fingerprint
 *  3. Flag        — detect price anomalies + data gaps
 *  4. Score       — compute confidence (0–100)
 *  5. Rank        — compute rank score + sort
 *
 * Every stage is a pure function of its inputs. No side effects,
 * no external calls, no randomness. The full pipeline is deterministic.
 */
export function runSearchPipeline(
  input: SearchPipelineInput
): SearchPipelineOutput {
  const start = performance.now();
  const weights: RankingWeights = { ...DEFAULT_WEIGHTS, ...input.weights };

  // ── Stage 1: Normalize ─────────────────────────────────────────────────

  const normalizedTitles = new Map<string, string>();
  const normalizedAddresses = new Map<string, string | null>();

  for (const listing of input.listings) {
    normalizedTitles.set(listing.id, normalizeTitle(listing.title));
    normalizedAddresses.set(listing.id, normalizeAddress(listing.address));
  }

  // ── Stage 2: Deduplicate ───────────────────────────────────────────────

  const { deduplicated, removedCount } = deduplicateListings(
    input.listings,
    normalizedTitles
  );

  // Build the set of dedup winner IDs for marking.
  const dedupWinnerIds = new Set(deduplicated.map((l) => l.id));

  // ── Stage 3: Compute batch statistics ──────────────────────────────────

  const prices = deduplicated.map((l) => l.price);
  const batchMedianPrice = median(prices);
  const batchMinPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const batchMaxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  // Expected currency: the most common currency in the batch.
  const expectedCurrency = modeCurrency(deduplicated);

  // Title counts for duplicate_title detection.
  // Rebuild from deduplicated set only.
  const dedupTitles = new Map<string, string>();
  for (const listing of deduplicated) {
    dedupTitles.set(listing.id, normalizedTitles.get(listing.id) ?? listing.title);
  }
  const titleCounts = buildTitleCounts(dedupTitles);

  // ── Stage 4 + 5: Flag → Score → Rank ──────────────────────────────────

  const results: ScoredListing[] = [];
  let priceFlaggedCount = 0;
  let dataFlaggedCount = 0;

  for (const listing of deduplicated) {
    const normTitle = normalizedTitles.get(listing.id) ?? listing.title;
    const normAddress = normalizedAddresses.get(listing.id) ?? null;

    // Flag
    const priceFlags = flagPrice(listing, batchMedianPrice, expectedCurrency);
    const dataFlags = flagData(listing, normTitle, titleCounts);

    if (priceFlags.length > 0) priceFlaggedCount++;
    if (dataFlags.length > 0) dataFlaggedCount++;

    // Score
    const confidence = computeConfidence(listing, normTitle, priceFlags, dataFlags);
    const keywordRelevance = computeKeywordRelevance(
      listing,
      normTitle,
      input.filters.query
    );

    // Rank
    const rankScore = computeRankScore(
      listing,
      confidence,
      keywordRelevance,
      priceFlags,
      dataFlags,
      batchMinPrice,
      batchMaxPrice,
      weights
    );

    results.push({
      listing,
      normalizedTitle: normTitle,
      normalizedAddress: normAddress,
      confidence,
      rankScore,
      priceFlags,
      dataFlags,
      keywordRelevance,
      isDedupWinner: dedupWinnerIds.has(listing.id),
    });
  }

  // ── Sort ───────────────────────────────────────────────────────────────

  sortByRank(results);

  // ── Return ─────────────────────────────────────────────────────────────

  const elapsed = performance.now() - start;

  return {
    results,
    duplicatesRemoved: removedCount,
    priceFlagged: priceFlaggedCount,
    dataFlagged: dataFlaggedCount,
    processingTimeMs: Math.round(elapsed * 100) / 100,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Find the most common currency in a listing batch. */
function modeCurrency(listings: RentalListing[]): string | undefined {
  if (listings.length === 0) return undefined;

  const counts = new Map<string, number>();
  for (const l of listings) {
    counts.set(l.currency, (counts.get(l.currency) ?? 0) + 1);
  }

  let best: string | undefined;
  let bestCount = 0;
  for (const [currency, count] of counts) {
    if (count > bestCount) {
      best = currency;
      bestCount = count;
    }
  }

  return best;
}
