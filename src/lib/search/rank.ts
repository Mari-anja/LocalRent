import type { RentalListing } from "@/types";
import type {
  ScoredListing,
  RankingWeights,
  PriceFlag,
  DataFlag,
} from "./types";
import { listingTypePreference, priceCompetitiveness } from "./score";

// ─── Rank Score Calculation ──────────────────────────────────────────────────

/**
 * Compute the final rank score for a single listing.
 *
 * The rank score is a weighted combination of multiple signals,
 * normalized to roughly 0–100. Higher = shown first.
 *
 * This function is the ONLY place where ranking logic lives.
 * All inputs are pre-computed; this function just combines them.
 *
 * Determinism guarantee: same inputs → same output, always.
 * No randomness, no time-dependence, no external state.
 */
export function computeRankScore(
  listing: RentalListing,
  confidence: number,
  keywordRelevance: number,
  priceFlags: PriceFlag[],
  dataFlags: DataFlag[],
  batchMinPrice: number,
  batchMaxPrice: number,
  weights: RankingWeights
): number {
  // ── Component scores (all 0–1) ─────────────────────────────────────────

  // 1. Confidence: already 0–100, normalize to 0–1
  const confidenceScore = confidence / 100;

  // 2. Has images: binary signal
  const imageScore = listing.imageUrls.length > 0 ? 1.0 : 0.0;

  // 3. Keyword relevance: already 0–1
  const relevanceScore = keywordRelevance;

  // 4. Listing type preference: 0–1
  const typeScore = listingTypePreference(listing.listingType);

  // 5. Price competitiveness: 0–1 (lower price = higher score)
  const priceScore = priceCompetitiveness(
    listing.price,
    batchMinPrice,
    batchMaxPrice
  );

  // 6. Penalties: each flag subtracts from the score
  const pricePenalty = priceFlags.length;
  const dataPenalty = dataFlags.length;

  // ── Weighted combination ───────────────────────────────────────────────

  const raw =
    weights.confidence * confidenceScore +
    weights.hasImages * imageScore +
    weights.keywordRelevance * relevanceScore +
    weights.listingTypePref * typeScore +
    weights.priceCompetitiveness * priceScore -
    weights.priceFlagPenalty * pricePenalty -
    weights.dataFlagPenalty * dataPenalty;

  // Scale to 0–100 range. The theoretical max of the positive terms
  // is the sum of all positive weights (currently 0.90). We normalize
  // against that so a perfect listing gets ~100.
  const maxPositive =
    weights.confidence +
    weights.hasImages +
    weights.keywordRelevance +
    weights.listingTypePref +
    weights.priceCompetitiveness;

  const normalized = maxPositive > 0 ? (raw / maxPositive) * 100 : 0;

  // Clamp to 0–100
  return Math.max(0, Math.min(100, Math.round(normalized * 100) / 100));
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

/**
 * Sort scored listings by rank score (descending).
 * Ties are broken by confidence, then by price (ascending).
 *
 * Mutates the array in place and returns it.
 */
export function sortByRank(results: ScoredListing[]): ScoredListing[] {
  return results.sort((a, b) => {
    // Primary: rank score (higher first)
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;

    // Tiebreaker 1: confidence (higher first)
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;

    // Tiebreaker 2: price (lower first)
    return a.listing.price - b.listing.price;
  });
}
