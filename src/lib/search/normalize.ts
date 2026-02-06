import type { RentalListing } from "@/types";
import type { PriceFlag, DataFlag } from "./types";

// ─── Title Normalization ─────────────────────────────────────────────────────

/**
 * Clean up a listing title for display and comparison.
 *
 * Steps:
 *  1. Trim whitespace
 *  2. Collapse multiple spaces / newlines into a single space
 *  3. Fix ALL-CAPS text (convert to title case)
 *  4. Strip trailing punctuation spam (!!!, ..., etc.)
 *  5. Strip leading/trailing dashes, pipes, bullets
 */
export function normalizeTitle(raw: string): string {
  let t = raw.trim();

  // Collapse whitespace
  t = t.replace(/\s+/g, " ");

  // Fix ALL-CAPS (3+ consecutive uppercase words → title case)
  if (isAllCaps(t)) {
    t = toTitleCase(t);
  }

  // Strip trailing punctuation spam
  t = t.replace(/[!.]{2,}$/, "");

  // Strip leading/trailing decoration characters
  t = t.replace(/^[\s\-|•*►]+|[\s\-|•*►]+$/g, "").trim();

  return t;
}

function isAllCaps(s: string): boolean {
  const letters = s.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^A-ZÀ-Ý]/g, "");
  return upper.length / letters.length > 0.8;
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|\s)\S/g, (ch) => ch.toUpperCase());
}

// ─── Address Normalization ───────────────────────────────────────────────────

/**
 * Clean up an address string for display and dedup comparison.
 */
export function normalizeAddress(raw: string | undefined): string | null {
  if (!raw) return null;

  let a = raw.trim();
  a = a.replace(/\s+/g, " ");
  // Strip trailing commas and whitespace
  a = a.replace(/[,\s]+$/, "");

  return a || null;
}

// ─── Deduplication ───────────────────────────────────────────────────────────

/**
 * Build a fingerprint for cross-source deduplication.
 *
 * Two listings are considered duplicates if they share the same
 * fingerprint. The fingerprint is built from normalized signals
 * that are likely to be identical across different scraped versions
 * of the same physical property.
 *
 * Strategy: normalized title + price + city + area (if present).
 * This is deliberately aggressive — false positives (merging two
 * genuinely different listings) are less harmful than false negatives
 * (showing the same apartment from 3 different sites).
 */
export function buildDedupFingerprint(
  listing: RentalListing,
  normalizedTitle: string
): string {
  const parts = [
    // Core identity: what it's called (normalized) + how much it costs
    normalizedTitle.toLowerCase().replace(/[^a-z0-9àáâãäåæçèéêëìíîïñòóôõöùúûüý]/g, ""),
    String(listing.price),
    listing.cityId,
  ];

  // Area is a strong differentiator when present.
  if (listing.areaSqm) {
    parts.push(String(listing.areaSqm));
  }

  return parts.join("|");
}

/**
 * Deduplicate listings across sources.
 *
 * When duplicates are found, we keep the "best" version — the one
 * with the most complete data. Returns the deduplicated array and
 * the count of removed duplicates.
 */
export function deduplicateListings(
  listings: RentalListing[],
  normalizedTitles: Map<string, string>
): { deduplicated: RentalListing[]; removedCount: number } {
  const seen = new Map<string, { listing: RentalListing; quality: number }>();

  for (const listing of listings) {
    const normTitle = normalizedTitles.get(listing.id) ?? listing.title;
    const fp = buildDedupFingerprint(listing, normTitle);
    const quality = quickQualityScore(listing);

    const existing = seen.get(fp);
    if (!existing || quality > existing.quality) {
      seen.set(fp, { listing, quality });
    }
  }

  const deduplicated = Array.from(seen.values()).map((v) => v.listing);
  return {
    deduplicated,
    removedCount: listings.length - deduplicated.length,
  };
}

/** Fast quality heuristic used only for dedup winner selection. */
function quickQualityScore(listing: RentalListing): number {
  let score = 0;
  if (listing.imageUrls.length > 0) score += 3;
  if (listing.description) score += 2;
  if (listing.areaSqm) score += 1;
  if (listing.bedrooms !== undefined) score += 1;
  if (listing.address) score += 1;
  if (listing.rooms !== undefined) score += 1;
  if (listing.bathrooms !== undefined) score += 1;
  return score;
}

// ─── Price Flagging ──────────────────────────────────────────────────────────

/**
 * Detect price anomalies on a single listing.
 *
 * Uses statistical context from the full batch (median price)
 * plus heuristic rules for obviously wrong values.
 */
export function flagPrice(
  listing: RentalListing,
  batchMedianPrice: number,
  expectedCurrency: string | undefined
): PriceFlag[] {
  const flags: PriceFlag[] = [];
  const price = listing.price;

  // ── Statistical outliers ─────────────────────────────────────────────
  // Below 20% of median → suspiciously cheap (likely daily/weekly rate)
  if (batchMedianPrice > 0 && price < batchMedianPrice * 0.2) {
    // Distinguish between daily and weekly by magnitude
    if (price < batchMedianPrice * 0.05) {
      flags.push("price_is_daily");
    } else {
      flags.push("price_is_weekly");
    }
  }

  // Above 500% of median → suspiciously expensive (likely total stay or sale)
  if (batchMedianPrice > 0 && price > batchMedianPrice * 5) {
    flags.push("price_is_total");
  }

  // ── Absolute bounds ──────────────────────────────────────────────────
  // No long-term rental in Europe is below €30/month
  if (price < 30) {
    if (!flags.includes("price_is_daily")) {
      flags.push("price_too_low");
    }
  }

  // Above €20k/month is almost certainly an error
  if (price > 20_000) {
    if (!flags.includes("price_is_total")) {
      flags.push("price_too_high");
    }
  }

  // ── Currency mismatch ────────────────────────────────────────────────
  if (expectedCurrency && listing.currency !== expectedCurrency) {
    flags.push("currency_mismatch");
  }

  return flags;
}

// ─── Data Quality Flagging ───────────────────────────────────────────────────

/**
 * Flag missing or suspicious data fields on a single listing.
 */
export function flagData(
  listing: RentalListing,
  normalizedTitle: string,
  titleCounts: Map<string, number>
): DataFlag[] {
  const flags: DataFlag[] = [];

  if (listing.imageUrls.length === 0) flags.push("missing_images");
  if (!listing.areaSqm) flags.push("missing_area");
  if (listing.rooms === undefined) flags.push("missing_rooms");
  if (!listing.address) flags.push("missing_address");
  if (!listing.description) flags.push("missing_description");

  // Title checks
  if (normalizedTitle.length < 10) flags.push("title_too_short");
  if (isAllCaps(listing.title)) flags.push("title_all_caps");

  // Duplicate title from a different source
  const titleKey = normalizedTitle.toLowerCase();
  const count = titleCounts.get(titleKey) ?? 0;
  if (count > 1) flags.push("duplicate_title");

  return flags;
}

// ─── Batch Helpers ───────────────────────────────────────────────────────────

/** Compute the median of a number array. Returns 0 for empty arrays. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Count how many times each normalized title appears.
 * Used to detect duplicate_title across different sources.
 */
export function buildTitleCounts(
  normalizedTitles: Map<string, string>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const title of normalizedTitles.values()) {
    const key = title.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
