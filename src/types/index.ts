// ─── Geographic Models ───────────────────────────────────────────────────────

export interface Country {
  id: string;
  name: string;
  code: string; // ISO 3166-1 alpha-2 (e.g. "HR", "PT", "ES")
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  /** Optional lat/lng for map features later */
  latitude?: number;
  longitude?: number;
}

// ─── Rental Site Models ──────────────────────────────────────────────────────

export interface RentalSite {
  id: string;
  name: string; // e.g. "Njuskalo", "Idealista", "Immobiliare"
  baseUrl: string;
  countryId: string;
  /** Logo URL for display in results */
  logoUrl?: string;
}

// ─── Listing Models ──────────────────────────────────────────────────────────

export type ListingType = "apartment" | "house" | "room" | "studio";
export type Currency = "EUR" | "USD" | "GBP" | "HRK";

export interface RentalListing {
  id: string;
  siteId: string;
  siteName: string;
  externalUrl: string;
  title: string;
  description?: string;
  listingType: ListingType;

  /** Monthly rent */
  price: number;
  currency: Currency;

  /** Size in square meters */
  areaSqm?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;

  address?: string;
  cityId: string;
  cityName: string;
  countryId: string;

  imageUrls: string[];
  /** ISO 8601 timestamp from the source site */
  publishedAt?: string;
  /** ISO 8601 timestamp when our scraper collected it */
  scrapedAt: string;
}

// ─── Search & Filter Models ──────────────────────────────────────────────────

export interface SearchFilters {
  countryId?: string;
  cityId?: string;
  /** Filter to specific rental sites */
  siteIds?: string[];
  listingType?: ListingType;
  priceMin?: number;
  priceMax?: number;
  areaSqmMin?: number;
  areaSqmMax?: number;
  roomsMin?: number;
  roomsMax?: number;
  /** Free-text keyword search */
  query?: string;
  /** Sort field */
  sortBy?: "price" | "area" | "date";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

// ─── Scrape Request / Response ───────────────────────────────────────────────
// These model the contract with Supabase Edge Functions.

export type ScrapeStatus = "pending" | "running" | "completed" | "failed";

export interface ScrapeRequest {
  id: string;
  siteId: string;
  cityId: string;
  filters?: Pick<SearchFilters, "listingType" | "priceMin" | "priceMax">;
  status: ScrapeStatus;
  createdAt: string;
}

export interface ScrapeResponse {
  requestId: string;
  status: ScrapeStatus;
  /** Total listings found in this scrape run */
  totalFound: number;
  /** New listings that weren't previously in our DB */
  newListings: number;
  listings: RentalListing[];
  /** Error message if status is "failed" */
  error?: string;
  completedAt?: string;
}
