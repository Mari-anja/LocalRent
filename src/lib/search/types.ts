import type { RentalListing, SearchFilters } from "@/types";

// ─── Flags ───────────────────────────────────────────────────────────────────

/**
 * Price anomaly flags.
 * Each flag is a specific, actionable signal — not a vague "suspicious".
 */
export type PriceFlag =
  | "price_too_low"       // Below statistical floor for the city
  | "price_too_high"      // Above statistical ceiling for the city
  | "price_is_weekly"     // Looks like a weekly rate, not monthly
  | "price_is_daily"      // Looks like a nightly/daily rate
  | "price_is_total"      // Looks like a total stay price, not per-month
  | "price_missing_cents" // Round number that may be truncated (€1000 vs €1000.00)
  | "currency_mismatch";  // Listed currency doesn't match country's default

export type DataFlag =
  | "missing_images"
  | "missing_area"
  | "missing_rooms"
  | "missing_address"
  | "missing_description"
  | "title_too_short"     // Likely truncated or generic
  | "title_all_caps"      // Spammy formatting
  | "duplicate_title"     // Same title from a different source
  | "stale_listing";      // scrapedAt is old relative to the batch

// ─── Scored Listing ──────────────────────────────────────────────────────────

export interface ScoredListing {
  /** The original listing, untouched. */
  listing: RentalListing;

  /** Normalized title (trimmed, de-capped, collapsed whitespace). */
  normalizedTitle: string;

  /** Normalized address (trimmed, collapsed whitespace) or null. */
  normalizedAddress: string | null;

  /**
   * Confidence score: 0–100.
   * Measures data completeness + internal consistency.
   * Higher = more trustworthy data.
   */
  confidence: number;

  /**
   * Ranking score: higher = shown first.
   * Combines confidence, relevance, and preference signals.
   */
  rankScore: number;

  /** Price anomaly flags (empty = price looks normal). */
  priceFlags: PriceFlag[];

  /** Data quality flags (empty = complete listing). */
  dataFlags: DataFlag[];

  /**
   * Keyword relevance score: 0–1.
   * How well the listing matches the user's search query.
   * 1.0 = every query token found. 0.0 = no matches.
   */
  keywordRelevance: number;

  /**
   * True if this listing was identified as a cross-source duplicate
   * and kept as the "best" version.
   */
  isDedupWinner: boolean;
}

// ─── Pipeline Config ─────────────────────────────────────────────────────────

/**
 * Tuning knobs for the ranking function.
 * All weights are relative — they don't need to sum to 1.
 */
export interface RankingWeights {
  /** Weight for confidence score (data quality). */
  confidence: number;
  /** Weight for having images. */
  hasImages: number;
  /** Weight for keyword relevance. */
  keywordRelevance: number;
  /** Weight for listing type preference (entire > private > shared). */
  listingTypePref: number;
  /** Weight for price competitiveness (lower is better). */
  priceCompetitiveness: number;
  /** Penalty multiplier for each price flag. */
  priceFlagPenalty: number;
  /** Penalty multiplier for each data flag. */
  dataFlagPenalty: number;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  confidence: 0.30,
  hasImages: 0.15,
  keywordRelevance: 0.20,
  listingTypePref: 0.10,
  priceCompetitiveness: 0.15,
  priceFlagPenalty: 0.05,
  dataFlagPenalty: 0.05,
};

// ─── Pipeline Input/Output ───────────────────────────────────────────────────

export interface SearchPipelineInput {
  /** Raw listings from one or more scrape responses. */
  listings: RentalListing[];
  /** The user's search filters (used for keyword matching). */
  filters: SearchFilters;
  /** Optional weight overrides. */
  weights?: Partial<RankingWeights>;
}

export interface SearchPipelineOutput {
  /** Scored + ranked listings, best first. */
  results: ScoredListing[];
  /** How many duplicates were removed. */
  duplicatesRemoved: number;
  /** How many listings were flagged with at least one price flag. */
  priceFlagged: number;
  /** How many listings were flagged with at least one data flag. */
  dataFlagged: number;
  /** Total processing time in milliseconds. */
  processingTimeMs: number;
}
