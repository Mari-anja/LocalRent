import type { CountryInfo } from "./types.ts";

/**
 * Country + site registry for the Edge Function.
 *
 * This is the server-side source of truth. It mirrors the frontend's
 * countries.ts but is self-contained for Deno.
 */
export const COUNTRIES: CountryInfo[] = [
  {
    id: "it",
    name: "Italy",
    language: "it",
    currency: "EUR",
    usdRate: 1.08,
    sites: [
      { id: "immobiliare", name: "Immobiliare.it", baseUrl: "https://www.immobiliare.it", countryId: "it" },
      { id: "idealista-it", name: "Idealista", baseUrl: "https://www.idealista.it", countryId: "it" },
      { id: "subito", name: "Subito.it", baseUrl: "https://www.subito.it", countryId: "it" },
      { id: "casa-it", name: "Casa.it", baseUrl: "https://www.casa.it", countryId: "it" },
    ],
  },
  {
    id: "fr",
    name: "France",
    language: "fr",
    currency: "EUR",
    usdRate: 1.08,
    sites: [
      { id: "leboncoin", name: "Leboncoin", baseUrl: "https://www.leboncoin.fr", countryId: "fr" },
      { id: "seloger", name: "SeLoger", baseUrl: "https://www.seloger.com", countryId: "fr" },
      { id: "pap", name: "PAP", baseUrl: "https://www.pap.fr", countryId: "fr" },
      { id: "logic-immo", name: "Logic-Immo", baseUrl: "https://www.logic-immo.com", countryId: "fr" },
    ],
  },
  {
    id: "es",
    name: "Spain",
    language: "es",
    currency: "EUR",
    usdRate: 1.08,
    sites: [
      { id: "idealista-es", name: "Idealista", baseUrl: "https://www.idealista.com", countryId: "es" },
      { id: "fotocasa", name: "Fotocasa", baseUrl: "https://www.fotocasa.es", countryId: "es" },
      { id: "milanuncios", name: "Milanuncios", baseUrl: "https://www.milanuncios.com", countryId: "es" },
      { id: "pisos", name: "Pisos.com", baseUrl: "https://www.pisos.com", countryId: "es" },
    ],
  },
  {
    id: "de",
    name: "Germany",
    language: "de",
    currency: "EUR",
    usdRate: 1.08,
    sites: [
      { id: "immoscout24", name: "ImmobilienScout24", baseUrl: "https://www.immobilienscout24.de", countryId: "de" },
      { id: "kleinanzeigen", name: "Kleinanzeigen", baseUrl: "https://www.kleinanzeigen.de", countryId: "de" },
      { id: "immowelt", name: "Immowelt", baseUrl: "https://www.immowelt.de", countryId: "de" },
      { id: "wg-gesucht", name: "WG-Gesucht", baseUrl: "https://www.wg-gesucht.de", countryId: "de" },
    ],
  },
  {
    id: "pt",
    name: "Portugal",
    language: "pt",
    currency: "EUR",
    usdRate: 1.08,
    sites: [
      { id: "idealista-pt", name: "Idealista", baseUrl: "https://www.idealista.pt", countryId: "pt" },
      { id: "imovirtual", name: "Imovirtual", baseUrl: "https://www.imovirtual.com", countryId: "pt" },
      { id: "casa-sapo", name: "Casa Sapo", baseUrl: "https://casa.sapo.pt", countryId: "pt" },
      { id: "supercasa", name: "Supercasa", baseUrl: "https://supercasa.pt", countryId: "pt" },
    ],
  },
];

export function findCountryBySiteId(siteId: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.sites.some((s) => s.id === siteId));
}

export function findSiteById(siteId: string): CountryInfo["sites"][number] | undefined {
  for (const country of COUNTRIES) {
    const site = country.sites.find((s) => s.id === siteId);
    if (site) return site;
  }
  return undefined;
}
