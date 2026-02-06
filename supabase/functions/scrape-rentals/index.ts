import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type {
  ScrapeRequest,
  ScrapeResponse,
  RentalListing,
  RuleViolation,
  ScrapedPageData,
} from "./types.ts";
import { findCountryBySiteId, findSiteById } from "./sites.ts";
import { searchListings, scrapeListing } from "./firecrawl.ts";
import { validateListing } from "./rules.ts";
import { buildListing } from "./normalize.ts";

// ─── Entry Point ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // ── CORS preflight ───────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  try {
    const body = await req.json();
    const request = validateRequest(body);
    const response = await orchestrate(request);
    return jsonResponse(200, response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[scrape-rentals]", message);
    return errorResponse(500, message);
  }
});

// ─── Request Validation ──────────────────────────────────────────────────────

function validateRequest(body: unknown): ScrapeRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object");
  }

  const b = body as Record<string, unknown>;

  if (typeof b.id !== "string" || !b.id) {
    throw new Error("Missing required field: id");
  }
  if (typeof b.siteId !== "string" || !b.siteId) {
    throw new Error("Missing required field: siteId");
  }
  if (typeof b.cityId !== "string" || !b.cityId) {
    throw new Error("Missing required field: cityId");
  }
  if (typeof b.cityName !== "string" || !b.cityName) {
    throw new Error("Missing required field: cityName");
  }

  // Validate siteId exists in our registry
  if (!findSiteById(b.siteId as string)) {
    throw new Error(`Unknown siteId: ${b.siteId}`);
  }

  // Validate filters if present
  if (b.filters !== undefined && b.filters !== null) {
    if (typeof b.filters !== "object") {
      throw new Error("filters must be an object");
    }
    const f = b.filters as Record<string, unknown>;
    if (f.listingType !== undefined) {
      const valid = ["apartment", "house", "room", "studio"];
      if (!valid.includes(f.listingType as string)) {
        throw new Error(`Invalid listingType: ${f.listingType}`);
      }
    }
    if (f.priceMin !== undefined && typeof f.priceMin !== "number") {
      throw new Error("priceMin must be a number");
    }
    if (f.priceMax !== undefined && typeof f.priceMax !== "number") {
      throw new Error("priceMax must be a number");
    }
  }

  return body as ScrapeRequest;
}

// ─── Orchestration ───────────────────────────────────────────────────────────

/**
 * Main pipeline:
 *
 *  1. Resolve site + country metadata
 *  2. Firecrawl search → list of URLs
 *  3. Firecrawl scrape → raw data per URL
 *  4. Business rules → filter bad listings
 *  5. Normalize → RentalListing[] with USD prices
 *  6. Apply price filters from the original request
 *  7. Package into ScrapeResponse
 */
async function orchestrate(request: ScrapeRequest): Promise<ScrapeResponse> {
  const site = findSiteById(request.siteId)!;
  const country = findCountryBySiteId(request.siteId)!;

  console.log(
    `[scrape-rentals] Starting: site=${site.name}, city=${request.cityName}, country=${country.name}`
  );

  // ── Step 1: Search for listing URLs ────────────────────────────────────

  let searchResults;
  try {
    searchResults = await searchListings(site.baseUrl, request.cityName, {
      listingType: request.filters?.listingType,
      maxResults: 20,
    });
  } catch (err) {
    return failedResponse(request.id, `Search failed: ${errorMessage(err)}`);
  }

  console.log(`[scrape-rentals] Search returned ${searchResults.length} URLs`);

  if (searchResults.length === 0) {
    return {
      requestId: request.id,
      status: "completed",
      totalFound: 0,
      newListings: 0,
      listings: [],
      completedAt: new Date().toISOString(),
    };
  }

  // ── Step 2: Scrape each URL ────────────────────────────────────────────

  const scrapeResults: ScrapedPageData[] = [];
  const scrapeErrors: string[] = [];

  // Process sequentially — correctness > performance.
  // Parallel scraping can be added later with concurrency limits.
  for (const result of searchResults) {
    try {
      const scraped = await scrapeListing(result.url);
      scrapeResults.push(scraped);
    } catch (err) {
      const msg = `Failed to scrape ${result.url}: ${errorMessage(err)}`;
      console.warn(`[scrape-rentals] ${msg}`);
      scrapeErrors.push(msg);
    }
  }

  console.log(
    `[scrape-rentals] Scraped ${scrapeResults.length}/${searchResults.length} URLs ` +
    `(${scrapeErrors.length} errors)`
  );

  // ── Step 3: Apply business rules ───────────────────────────────────────

  const seenUrls = new Set<string>();
  const accepted: ScrapedPageData[] = [];
  const rejected: RuleViolation[] = [];

  for (const scraped of scrapeResults) {
    const violation = validateListing(scraped, seenUrls);
    if (violation) {
      rejected.push(violation);
      console.log(
        `[scrape-rentals] REJECTED: ${violation.reason} — ${violation.detail}`
      );
    } else {
      accepted.push(scraped);
    }
  }

  console.log(
    `[scrape-rentals] Rules: ${accepted.length} accepted, ${rejected.length} rejected`
  );

  // ── Step 4: Normalize into RentalListings ──────────────────────────────

  const listings: RentalListing[] = accepted.map((scraped) =>
    buildListing(scraped, site, country, request.cityId, request.cityName)
  );

  // ── Step 5: Apply caller's price filters (in USD) ─────────────────────

  const filtered = applyPriceFilters(listings, request, country.usdRate);

  console.log(
    `[scrape-rentals] Final: ${filtered.length} listings ` +
    `(${listings.length - filtered.length} removed by price filter)`
  );

  // ── Step 6: Return response ────────────────────────────────────────────

  return {
    requestId: request.id,
    status: "completed",
    totalFound: searchResults.length,
    newListings: filtered.length,
    listings: filtered,
    completedAt: new Date().toISOString(),
  };
}

// ─── Price Filtering ─────────────────────────────────────────────────────────

/**
 * Apply the request's priceMin/priceMax filters.
 *
 * The filters in the request are in local currency (from the frontend),
 * so we compare against the listing's local price, not priceUsd.
 */
function applyPriceFilters(
  listings: RentalListing[],
  request: ScrapeRequest,
  _usdRate: number
): RentalListing[] {
  const { priceMin, priceMax } = request.filters ?? {};

  if (priceMin === undefined && priceMax === undefined) {
    return listings;
  }

  return listings.filter((listing) => {
    if (priceMin !== undefined && listing.price < priceMin) return false;
    if (priceMax !== undefined && listing.price > priceMax) return false;
    return true;
  });
}

// ─── Response Helpers ────────────────────────────────────────────────────────

function failedResponse(requestId: string, error: string): ScrapeResponse {
  return {
    requestId,
    status: "failed",
    totalFound: 0,
    newListings: 0,
    listings: [],
    error,
    completedAt: new Date().toISOString(),
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
    },
  });
}

function errorResponse(status: number, message: string): Response {
  return jsonResponse(status, { error: message });
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
