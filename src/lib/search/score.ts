import type { RentalListing } from "@/types";
import type { PriceFlag, DataFlag } from "./types";

// ─── Confidence Scoring ──────────────────────────────────────────────────────

/**
 * Compute a confidence score (0–100) for a listing.
 *
 * Confidence measures how much we trust the data — not how desirable
 * the listing is. A 100-score means every field is present and
 * internally consistent. A low score means the listing is sketchy
 * or missing data.
 *
 * The score is a weighted sum of discrete signals, each contributing
 * a fixed number of points. This makes the function fully deterministic
 * and easy to test: same input → same output, always.
 *
 * Breakdown (sums to 100):
 *   Core data presence       : 50 pts
 *   Image quality            : 15 pts
 *   Description quality      : 10 pts
 *   Price consistency        :  15 pts
 *   Title quality            : 10 pts
 */
export function computeConfidence(
  listing: RentalListing,
  normalizedTitle: string,
  priceFlags: PriceFlag[],
  dataFlags: DataFlag[]
): number {
  let score = 0;

  // ── Core data presence (50 pts) ────────────────────────────────────────

  // Price is always present (it's required) → 10 pts free
  score += 10;

  // Area
  if (listing.areaSqm && listing.areaSqm > 0) score += 10;

  // Rooms / bedrooms (either one counts)
  if (listing.rooms !== undefined || listing.bedrooms !== undefined) score += 8;

  // Bathrooms
  if (listing.bathrooms !== undefined) score += 4;

  // Address
  if (listing.address) score += 10;

  // Listing type (explicit, not defaulted)
  if (listing.listingType) score += 8;

  // ── Image quality (15 pts) ─────────────────────────────────────────────

  const imgCount = listing.imageUrls.length;
  if (imgCount >= 5) score += 15;
  else if (imgCount >= 3) score += 12;
  else if (imgCount >= 1) score += 8;
  // 0 images → 0 pts

  // ── Description quality (10 pts) ───────────────────────────────────────

  const descLen = listing.description?.length ?? 0;
  if (descLen >= 200) score += 10;
  else if (descLen >= 50) score += 6;
  else if (descLen > 0) score += 3;

  // ── Price consistency (15 pts) ─────────────────────────────────────────
  // Start at 15, subtract per flag.

  const priceScore = Math.max(0, 15 - priceFlags.length * 5);
  score += priceScore;

  // ── Title quality (10 pts) ─────────────────────────────────────────────

  if (normalizedTitle.length >= 20) score += 6;
  else if (normalizedTitle.length >= 10) score += 3;

  if (!dataFlags.includes("title_all_caps")) score += 2;
  if (!dataFlags.includes("duplicate_title")) score += 2;

  // Clamp to 0–100
  return Math.max(0, Math.min(100, score));
}

// ─── Keyword Relevance ───────────────────────────────────────────────────────

/**
 * Compute keyword relevance (0–1) between a query string and a listing.
 *
 * Strategy:
 *  1. Tokenize the query into words (lowercase, stripped of punctuation).
 *  2. Check each token against the listing's title, description,
 *     address, city name, and listing type.
 *  3. Score = matched tokens / total tokens.
 *
 * This is deliberately simple — no TF-IDF, no stemming. It's fast,
 * deterministic, and good enough for the current feature set.
 */
export function computeKeywordRelevance(
  listing: RentalListing,
  normalizedTitle: string,
  query: string | undefined
): number {
  if (!query || !query.trim()) return 0;

  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  // Build the search corpus from all text fields.
  const corpus = [
    normalizedTitle,
    listing.description ?? "",
    listing.address ?? "",
    listing.cityName,
    listing.listingType,
    listing.siteName,
  ]
    .join(" ")
    .toLowerCase();

  let matched = 0;
  for (const token of tokens) {
    if (corpus.includes(token)) {
      matched++;
    }
  }

  return matched / tokens.length;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2); // Skip single-char tokens
}

// ─── Listing Type Preference ─────────────────────────────────────────────────

/**
 * Map listing types to a 0–1 preference scale.
 * Entire place is most desirable, shared room least.
 *
 * apartment/house = entire place → 1.0
 * studio = entire (small) → 0.9
 * room = private room → 0.5
 */
const TYPE_PREFERENCE: Record<string, number> = {
  apartment: 1.0,
  house: 1.0,
  studio: 0.9,
  room: 0.5,
};

export function listingTypePreference(type: string): number {
  return TYPE_PREFERENCE[type] ?? 0.5;
}

// ─── Price Competitiveness ───────────────────────────────────────────────────

/**
 * Score how competitive a price is within its batch.
 * Returns 0–1 where 1.0 = cheapest in the batch.
 *
 * Uses min-max normalization, inverted: (max - price) / (max - min).
 * If all prices are equal, returns 0.5.
 */
export function priceCompetitiveness(
  price: number,
  minPrice: number,
  maxPrice: number
): number {
  if (maxPrice <= minPrice) return 0.5;
  return (maxPrice - price) / (maxPrice - minPrice);
}
