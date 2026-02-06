/**
 * Shared types for the scrape-rentals Edge Function.
 *
 * These mirror the frontend types but are self-contained — no @/ aliases,
 * no npm imports. Deno Edge Functions can't resolve the frontend's
 * tsconfig paths, so we duplicate the subset we need here.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type Currency = "EUR" | "USD" | "GBP" | "HRK";
export type LanguageCode = "it" | "fr" | "es" | "de" | "pt" | "en" | "hr";
export type ListingType = "apartment" | "house" | "room" | "studio";
export type ScrapeStatus = "pending" | "running" | "completed" | "failed";

// ─── Site / Country ──────────────────────────────────────────────────────────

export interface RentalSite {
  id: string;
  name: string;
  baseUrl: string;
  countryId: string;
}

export interface CountryInfo {
  id: string;
  name: string;
  language: LanguageCode;
  currency: Currency;
  usdRate: number;
  sites: RentalSite[];
}

// ─── Listing ─────────────────────────────────────────────────────────────────

export interface RentalListing {
  id: string;
  siteId: string;
  siteName: string;
  externalUrl: string;
  title: string;
  description?: string;
  listingType: ListingType;
  price: number;
  currency: Currency;
  priceUsd: number;
  areaSqm?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  address?: string;
  cityId: string;
  cityName: string;
  countryId: string;
  imageUrls: string[];
  publishedAt?: string;
  scrapedAt: string;
}

// ─── Request / Response ──────────────────────────────────────────────────────

export interface ScrapeRequest {
  id: string;
  siteId: string;
  cityId: string;
  cityName: string;
  filters?: {
    listingType?: ListingType;
    priceMin?: number;
    priceMax?: number;
  };
}

export interface ScrapeResponse {
  requestId: string;
  status: ScrapeStatus;
  totalFound: number;
  newListings: number;
  listings: RentalListing[];
  error?: string;
  completedAt?: string;
}

// ─── Firecrawl ───────────────────────────────────────────────────────────────

/** A single result from Firecrawl's /search endpoint. */
export interface FirecrawlSearchResult {
  url: string;
  title?: string;
  description?: string;
}

/** Structured data we attempt to extract from a scraped page. */
export interface ScrapedPageData {
  url: string;
  title: string;
  description: string;
  /** Raw price string as it appears on the page, e.g. "€750/mese" */
  rawPrice: string;
  /** Parsed numeric price in local currency */
  price: number | null;
  currency: Currency | null;
  areaSqm: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  address: string | null;
  imageUrls: string[];
  listingType: ListingType | null;
}

// ─── Business Rules ──────────────────────────────────────────────────────────

export type RejectionReason =
  | "airbnb_or_vacation"
  | "for_sale_not_rent"
  | "commercial_property"
  | "duplicate_url"
  | "missing_price"
  | "price_out_of_range"
  | "blocked_domain";

export interface RuleViolation {
  url: string;
  reason: RejectionReason;
  detail: string;
}
