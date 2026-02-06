import type { ScrapedPageData, RuleViolation, RejectionReason } from "./types.ts";

// ─── Blocked Domains ─────────────────────────────────────────────────────────

/**
 * Domains that must never appear in results, regardless of how they
 * surfaced. These are vacation/short-term platforms, not classifieds.
 */
const BLOCKED_DOMAINS = new Set([
  "airbnb.com",
  "airbnb.it",
  "airbnb.fr",
  "airbnb.es",
  "airbnb.de",
  "airbnb.pt",
  "booking.com",
  "vrbo.com",
  "homeaway.com",
  "tripadvisor.com",
  "expedia.com",
  "hotels.com",
  "agoda.com",
  "spotahome.com",
  "uniplaces.com",
  "housinganywhere.com",
]);

// ─── Keyword Blocklists ──────────────────────────────────────────────────────

/**
 * If ANY of these appear in the title or description (case-insensitive),
 * the listing is rejected as "for sale, not rent".
 */
const SALE_KEYWORDS = [
  // English
  "for sale", "buy now", "asking price", "sale price", "mortgage",
  // Italian
  "vendita", "in vendita", "prezzo di vendita", "vendesi",
  // French
  "à vendre", "vente", "prix de vente", "achat",
  // Spanish
  "en venta", "se vende", "precio de venta", "compra",
  // German
  "zu verkaufen", "kaufpreis", "verkauf",
  // Portuguese
  "à venda", "venda", "preço de venda",
];

/**
 * Vacation / short-term rental signals.
 */
const VACATION_KEYWORDS = [
  // English
  "per night", "per week", "nightly rate", "vacation rental",
  "holiday let", "short-term", "short term", "airbnb",
  // Italian
  "a notte", "a settimana", "affitto breve", "affitto turistico",
  "casa vacanze", "vacanza",
  // French
  "par nuit", "par semaine", "location saisonnière",
  "location vacances", "meublé de tourisme",
  // Spanish
  "por noche", "por semana", "alquiler vacacional",
  "alquiler turístico", "alquiler temporal",
  // German
  "pro nacht", "pro woche", "ferienwohnung",
  "ferienhaus", "kurzzeitmiete",
  // Portuguese
  "por noite", "por semana", "aluguer de férias",
  "arrendamento turístico",
];

/**
 * Commercial / non-residential signals.
 */
const COMMERCIAL_KEYWORDS = [
  // English
  "office space", "commercial", "retail", "warehouse", "industrial",
  // Italian
  "ufficio", "commerciale", "negozio", "capannone", "magazzino",
  // French
  "bureau", "commercial", "local commercial", "entrepôt",
  // Spanish
  "oficina", "local comercial", "nave industrial", "almacén",
  // German
  "büro", "gewerbe", "gewerbefläche", "lagerhalle",
  // Portuguese
  "escritório", "comercial", "armazém",
];

// ─── Price Bounds ────────────────────────────────────────────────────────────

/**
 * Absolute price boundaries (in local currency, monthly).
 * Anything outside these is almost certainly a data-extraction error
 * or a for-sale price that slipped through keyword detection.
 */
const PRICE_FLOOR = 50;   // Below €50/mo is not a real long-term rental
const PRICE_CEILING = 25_000; // Above €25k/mo is likely a sale price or error

// ─── Rule Engine ─────────────────────────────────────────────────────────────

/**
 * Run every business rule against a scraped listing.
 * Returns null if the listing passes all rules, or a RuleViolation
 * describing why it was rejected.
 *
 * Rules are evaluated in order of cheapness — fast string checks first,
 * price checks last.
 */
export function validateListing(
  data: ScrapedPageData,
  seenUrls: Set<string>
): RuleViolation | null {
  const url = data.url;

  // ── Rule 1: Blocked domain ─────────────────────────────────────────────
  const hostname = safeHostname(url);
  if (hostname && isDomainBlocked(hostname)) {
    return violation(url, "blocked_domain", `Domain ${hostname} is blocked`);
  }

  // ── Rule 2: Duplicate URL ──────────────────────────────────────────────
  const canonical = canonicalizeUrl(url);
  if (seenUrls.has(canonical)) {
    return violation(url, "duplicate_url", "Duplicate listing URL");
  }
  seenUrls.add(canonical);

  // ── Rule 3: For-sale listing ───────────────────────────────────────────
  const text = `${data.title} ${data.description}`.toLowerCase();

  const saleHit = SALE_KEYWORDS.find((kw) => text.includes(kw));
  if (saleHit) {
    return violation(url, "for_sale_not_rent", `Matched sale keyword: "${saleHit}"`);
  }

  // ── Rule 4: Vacation / short-term ──────────────────────────────────────
  const vacationHit = VACATION_KEYWORDS.find((kw) => text.includes(kw));
  if (vacationHit) {
    return violation(url, "airbnb_or_vacation", `Matched vacation keyword: "${vacationHit}"`);
  }

  // ── Rule 5: Commercial property ────────────────────────────────────────
  const commercialHit = COMMERCIAL_KEYWORDS.find((kw) => text.includes(kw));
  if (commercialHit) {
    return violation(url, "commercial_property", `Matched commercial keyword: "${commercialHit}"`);
  }

  // ── Rule 6: Missing price ──────────────────────────────────────────────
  if (data.price === null) {
    return violation(url, "missing_price", `Could not parse price from: "${data.rawPrice}"`);
  }

  // ── Rule 7: Price sanity ───────────────────────────────────────────────
  if (data.price < PRICE_FLOOR) {
    return violation(
      url,
      "price_out_of_range",
      `Price ${data.price} is below floor of ${PRICE_FLOOR}`
    );
  }
  if (data.price > PRICE_CEILING) {
    return violation(
      url,
      "price_out_of_range",
      `Price ${data.price} exceeds ceiling of ${PRICE_CEILING} (likely a sale price)`
    );
  }

  return null; // All rules passed
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function violation(url: string, reason: RejectionReason, detail: string): RuleViolation {
  return { url, reason, detail };
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isDomainBlocked(hostname: string): boolean {
  // Check if the hostname itself or any parent domain is blocked.
  // e.g. "www.airbnb.it" → check "airbnb.it"
  const clean = hostname.replace(/^www\./, "");
  if (BLOCKED_DOMAINS.has(clean)) return true;

  // Check parent domain: "listings.airbnb.com" → "airbnb.com"
  const parts = clean.split(".");
  if (parts.length > 2) {
    const parent = parts.slice(-2).join(".");
    if (BLOCKED_DOMAINS.has(parent)) return true;
  }

  return false;
}

/**
 * Normalize a URL for deduplication.
 * Strips protocol, www, trailing slashes, and common tracking params.
 */
function canonicalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove tracking parameters
    const stripParams = ["utm_source", "utm_medium", "utm_campaign", "ref", "fbclid", "gclid"];
    for (const p of stripParams) {
      u.searchParams.delete(p);
    }
    // Normalize
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "");
    const search = u.searchParams.toString();
    return `${host}${path}${search ? "?" + search : ""}`;
  } catch {
    return url;
  }
}
