import type { FirecrawlSearchResult, ScrapedPageData, ListingType, Currency } from "./types.ts";

// ─── Config ──────────────────────────────────────────────────────────────────

const FIRECRAWL_API = "https://api.firecrawl.dev/v1";

function getApiKey(): string {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY is not set");
  return key;
}

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getApiKey()}`,
  };
}

// ─── Search ──────────────────────────────────────────────────────────────────

/**
 * Use Firecrawl's /search endpoint to find rental listing URLs
 * on a specific site for a given city.
 *
 * The search query is constructed to target long-term rentals
 * and exclude noise (sales, vacation, Airbnb).
 */
export async function searchListings(
  siteBaseUrl: string,
  cityName: string,
  opts?: { listingType?: string; maxResults?: number }
): Promise<FirecrawlSearchResult[]> {
  const propertyTerm = opts?.listingType ?? "apartment";
  const limit = opts?.maxResults ?? 20;

  // Build a targeted query scoped to the site's domain.
  // Negative terms reduce noise at the search level.
  const query = [
    `site:${new URL(siteBaseUrl).hostname}`,
    `${propertyTerm} rent ${cityName}`,
    `-sale -buy -airbnb -booking -vacation -holiday`,
  ].join(" ");

  const response = await fetch(`${FIRECRAWL_API}/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      query,
      limit,
      scrapeOptions: {
        formats: ["markdown"],
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl search failed (${response.status}): ${text}`);
  }

  const body = await response.json();
  const results: FirecrawlSearchResult[] = (body.data ?? []).map(
    (r: Record<string, unknown>) => ({
      url: r.url as string,
      title: (r.title as string) ?? undefined,
      description: (r.description as string) ?? undefined,
    })
  );

  return results;
}

// ─── Scrape ──────────────────────────────────────────────────────────────────

/**
 * Scrape a single listing URL with Firecrawl and extract structured data.
 *
 * We request both markdown (for text extraction) and raw HTML (for
 * structured data like price, images, etc.) via the /scrape endpoint.
 */
export async function scrapeListing(url: string): Promise<ScrapedPageData> {
  const response = await fetch(`${FIRECRAWL_API}/scrape`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      url,
      formats: ["markdown", "extract"],
      extract: {
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Listing title" },
            description: { type: "string", description: "Full listing description text" },
            price: { type: "string", description: "Monthly rental price with currency symbol, e.g. '€750/mese' or '950€/mois'" },
            area_sqm: { type: "number", description: "Property area in square meters" },
            rooms: { type: "number", description: "Total number of rooms" },
            bedrooms: { type: "number", description: "Number of bedrooms" },
            bathrooms: { type: "number", description: "Number of bathrooms" },
            address: { type: "string", description: "Full address or location" },
            images: {
              type: "array",
              items: { type: "string" },
              description: "URLs of listing photos",
            },
            property_type: {
              type: "string",
              enum: ["apartment", "house", "room", "studio"],
              description: "Type of property",
            },
          },
          required: ["title", "price"],
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl scrape failed for ${url} (${response.status}): ${text}`);
  }

  const body = await response.json();
  const extract = body.data?.extract ?? {};
  const rawPrice = String(extract.price ?? "");

  return {
    url,
    title: String(extract.title ?? "Untitled"),
    description: String(extract.description ?? ""),
    rawPrice,
    price: parsePrice(rawPrice),
    currency: parseCurrency(rawPrice),
    areaSqm: toNumberOrNull(extract.area_sqm),
    rooms: toNumberOrNull(extract.rooms),
    bedrooms: toNumberOrNull(extract.bedrooms),
    bathrooms: toNumberOrNull(extract.bathrooms),
    address: extract.address ? String(extract.address) : null,
    imageUrls: Array.isArray(extract.images)
      ? extract.images.filter((u: unknown) => typeof u === "string")
      : [],
    listingType: isValidListingType(extract.property_type)
      ? extract.property_type
      : null,
  };
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

/**
 * Extract a numeric price from a raw string like "€750/mese",
 * "950 €", "1.200€", "1,200 EUR".
 *
 * Handles European decimal separators (1.200,50 → 1200.50).
 */
function parsePrice(raw: string): number | null {
  if (!raw) return null;

  // Remove everything except digits, dots, commas.
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  // European format: 1.200,50 → dots are thousands, comma is decimal.
  // US format:       1,200.50 → commas are thousands, dot is decimal.
  let normalized: string;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    // Both present — determine which is the decimal separator.
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");

    if (lastComma > lastDot) {
      // European: 1.200,50
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // US: 1,200.50
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    // Comma only: could be "1,200" (thousands) or "750,50" (decimal).
    // Heuristic: if exactly 3 digits after comma, treat as thousands.
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length === 3) {
      normalized = cleaned.replace(",", "");
    } else {
      normalized = cleaned.replace(",", ".");
    }
  } else {
    // Dot only or no separator.
    // "1.200" (European thousands) vs "750.50" (decimal).
    const parts = cleaned.split(".");
    if (parts.length === 2 && parts[1].length === 3) {
      normalized = cleaned.replace(".", "");
    } else {
      normalized = cleaned;
    }
  }

  const num = parseFloat(normalized);
  return isFinite(num) && num > 0 ? num : null;
}

/** Detect currency from a raw price string. */
function parseCurrency(raw: string): Currency | null {
  const upper = raw.toUpperCase();
  if (raw.includes("€") || upper.includes("EUR")) return "EUR";
  if (raw.includes("$") || upper.includes("USD")) return "USD";
  if (raw.includes("£") || upper.includes("GBP")) return "GBP";
  if (upper.includes("HRK") || upper.includes("KN")) return "HRK";
  return null;
}

function isValidListingType(val: unknown): val is ListingType {
  return (
    typeof val === "string" &&
    ["apartment", "house", "room", "studio"].includes(val)
  );
}

function toNumberOrNull(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isFinite(n) && n > 0 ? n : null;
}
