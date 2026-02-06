import type {
  ScrapedPageData,
  RentalListing,
  CountryInfo,
  Currency,
  RentalSite,
} from "./types.ts";

// ─── USD Conversion ──────────────────────────────────────────────────────────

/**
 * Convert a price from a local currency to USD.
 *
 * Uses the static rates from the country registry for now.
 * Will be replaced by a live FX API once the backend matures.
 */
export function toUsd(amount: number, currency: Currency, usdRate: number): number {
  // usdRate = how many USD 1 unit of local currency buys.
  // e.g. EUR → USD = 1.08, so €750 → $810
  return round(amount * usdRate, 2);
}

// ─── Listing Assembly ────────────────────────────────────────────────────────

/**
 * Convert raw scraped page data into a normalized RentalListing.
 *
 * This is the single source of truth for how a scraped page becomes
 * a listing in our system. Every field has an explicit fallback.
 */
export function buildListing(
  scraped: ScrapedPageData,
  site: RentalSite,
  country: CountryInfo,
  cityId: string,
  cityName: string
): RentalListing {
  // Price and currency — use scraped values, fall back to country defaults.
  const price = scraped.price!; // Caller must ensure price is non-null (rules.ts filters nulls)
  const currency = scraped.currency ?? country.currency;
  const priceUsd = toUsd(price, currency, country.usdRate);

  // Listing type — fall back to "apartment" if extraction missed it.
  const listingType = scraped.listingType ?? "apartment";

  return {
    id: generateListingId(scraped.url),
    siteId: site.id,
    siteName: site.name,
    externalUrl: scraped.url,
    title: scraped.title,
    description: scraped.description || undefined,
    listingType,
    price,
    currency,
    priceUsd,
    areaSqm: scraped.areaSqm ?? undefined,
    rooms: scraped.rooms ?? undefined,
    bedrooms: scraped.bedrooms ?? undefined,
    bathrooms: scraped.bathrooms ?? undefined,
    address: scraped.address ?? undefined,
    cityId,
    cityName,
    countryId: country.id,
    imageUrls: scraped.imageUrls,
    scrapedAt: new Date().toISOString(),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive a deterministic ID from the listing URL.
 * This ensures the same listing always gets the same ID,
 * which makes deduplication in the database trivial.
 */
function generateListingId(url: string): string {
  // Use a simple hash of the canonical URL.
  // In production this would be a proper UUID v5 or SHA-256 prefix.
  let hash = 0;
  const str = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Convert to positive hex string, padded to 8 chars.
  const hex = (hash >>> 0).toString(16).padStart(8, "0");
  return `lr_${hex}`;
}

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}
