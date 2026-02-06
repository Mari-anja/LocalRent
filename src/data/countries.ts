import type { Country } from "@/types";

/**
 * Initial country dataset for LocalRent.
 *
 * Sites are ordered by priority — largest / most relevant classifieds first.
 * USD rates are approximate (Feb 2026) and will be replaced by a live
 * conversion service once the backend is wired up.
 */
export const COUNTRIES: Country[] = [
  // ── Italy ────────────────────────────────────────────────────────────────
  {
    id: "it",
    name: "Italy",
    code: "IT",
    flag: "\u{1F1EE}\u{1F1F9}",
    language: "it",
    currency: "EUR",
    currencySymbol: "\u20AC",
    usdRate: 1.08,
    sites: [
      {
        id: "immobiliare",
        name: "Immobiliare.it",
        baseUrl: "https://www.immobiliare.it",
        countryId: "it",
      },
      {
        id: "idealista-it",
        name: "Idealista",
        baseUrl: "https://www.idealista.it",
        countryId: "it",
      },
      {
        id: "subito",
        name: "Subito.it",
        baseUrl: "https://www.subito.it",
        countryId: "it",
      },
      {
        id: "casa-it",
        name: "Casa.it",
        baseUrl: "https://www.casa.it",
        countryId: "it",
      },
    ],
  },

  // ── France ───────────────────────────────────────────────────────────────
  {
    id: "fr",
    name: "France",
    code: "FR",
    flag: "\u{1F1EB}\u{1F1F7}",
    language: "fr",
    currency: "EUR",
    currencySymbol: "\u20AC",
    usdRate: 1.08,
    sites: [
      {
        id: "leboncoin",
        name: "Leboncoin",
        baseUrl: "https://www.leboncoin.fr",
        countryId: "fr",
      },
      {
        id: "seloger",
        name: "SeLoger",
        baseUrl: "https://www.seloger.com",
        countryId: "fr",
      },
      {
        id: "pap",
        name: "PAP",
        baseUrl: "https://www.pap.fr",
        countryId: "fr",
      },
      {
        id: "logic-immo",
        name: "Logic-Immo",
        baseUrl: "https://www.logic-immo.com",
        countryId: "fr",
      },
    ],
  },

  // ── Spain ────────────────────────────────────────────────────────────────
  {
    id: "es",
    name: "Spain",
    code: "ES",
    flag: "\u{1F1EA}\u{1F1F8}",
    language: "es",
    currency: "EUR",
    currencySymbol: "\u20AC",
    usdRate: 1.08,
    sites: [
      {
        id: "idealista-es",
        name: "Idealista",
        baseUrl: "https://www.idealista.com",
        countryId: "es",
      },
      {
        id: "fotocasa",
        name: "Fotocasa",
        baseUrl: "https://www.fotocasa.es",
        countryId: "es",
      },
      {
        id: "milanuncios",
        name: "Milanuncios",
        baseUrl: "https://www.milanuncios.com",
        countryId: "es",
      },
      {
        id: "pisos",
        name: "Pisos.com",
        baseUrl: "https://www.pisos.com",
        countryId: "es",
      },
    ],
  },

  // ── Germany ──────────────────────────────────────────────────────────────
  {
    id: "de",
    name: "Germany",
    code: "DE",
    flag: "\u{1F1E9}\u{1F1EA}",
    language: "de",
    currency: "EUR",
    currencySymbol: "\u20AC",
    usdRate: 1.08,
    sites: [
      {
        id: "immoscout24",
        name: "ImmobilienScout24",
        baseUrl: "https://www.immobilienscout24.de",
        countryId: "de",
      },
      {
        id: "kleinanzeigen",
        name: "Kleinanzeigen",
        baseUrl: "https://www.kleinanzeigen.de",
        countryId: "de",
      },
      {
        id: "immowelt",
        name: "Immowelt",
        baseUrl: "https://www.immowelt.de",
        countryId: "de",
      },
      {
        id: "wg-gesucht",
        name: "WG-Gesucht",
        baseUrl: "https://www.wg-gesucht.de",
        countryId: "de",
      },
    ],
  },

  // ── Portugal ─────────────────────────────────────────────────────────────
  {
    id: "pt",
    name: "Portugal",
    code: "PT",
    flag: "\u{1F1F5}\u{1F1F9}",
    language: "pt",
    currency: "EUR",
    currencySymbol: "\u20AC",
    usdRate: 1.08,
    sites: [
      {
        id: "idealista-pt",
        name: "Idealista",
        baseUrl: "https://www.idealista.pt",
        countryId: "pt",
      },
      {
        id: "imovirtual",
        name: "Imovirtual",
        baseUrl: "https://www.imovirtual.com",
        countryId: "pt",
      },
      {
        id: "casa-sapo",
        name: "Casa Sapo",
        baseUrl: "https://casa.sapo.pt",
        countryId: "pt",
      },
      {
        id: "supercasa",
        name: "Supercasa",
        baseUrl: "https://supercasa.pt",
        countryId: "pt",
      },
    ],
  },
];

/** Lookup a country by its id (ISO alpha-2 lowercase). */
export function getCountryById(id: string): Country | undefined {
  return COUNTRIES.find((c) => c.id === id);
}

/** Flat list of every rental site across all countries. */
export const ALL_SITES = COUNTRIES.flatMap((c) => c.sites);
