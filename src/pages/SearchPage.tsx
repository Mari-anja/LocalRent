import { Search } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import type { RentalListing } from "@/types";

// ── Mock data (temporary — will be replaced by real Supabase queries) ────────

const MOCK_LISTINGS: RentalListing[] = [
  {
    id: "1",
    siteId: "njuskalo",
    siteName: "Njuskalo",
    externalUrl: "https://example.com/listing/1",
    title: "Sunny 2-bedroom apartment in Split center",
    listingType: "apartment",
    price: 750,
    currency: "EUR",
    areaSqm: 65,
    bedrooms: 2,
    rooms: 3,
    address: "Vukovarska 12, Split",
    cityId: "split",
    cityName: "Split",
    countryId: "hr",
    imageUrls: [],
    scrapedAt: new Date().toISOString(),
  },
  {
    id: "2",
    siteId: "idealista",
    siteName: "Idealista",
    externalUrl: "https://example.com/listing/2",
    title: "Modern studio near Bairro Alto, Lisbon",
    listingType: "studio",
    price: 950,
    currency: "EUR",
    areaSqm: 35,
    bedrooms: 0,
    rooms: 1,
    address: "Rua da Rosa 42, Lisboa",
    cityId: "lisbon",
    cityName: "Lisbon",
    countryId: "pt",
    imageUrls: [],
    scrapedAt: new Date().toISOString(),
  },
  {
    id: "3",
    siteId: "fotocasa",
    siteName: "Fotocasa",
    externalUrl: "https://example.com/listing/3",
    title: "Bright room in shared flat, Eixample",
    listingType: "room",
    price: 550,
    currency: "EUR",
    areaSqm: 14,
    bedrooms: 1,
    rooms: 1,
    address: "Carrer de Valencia 180, Barcelona",
    cityId: "barcelona",
    cityName: "Barcelona",
    countryId: "es",
    imageUrls: [],
    scrapedAt: new Date().toISOString(),
  },
  {
    id: "4",
    siteId: "njuskalo",
    siteName: "Njuskalo",
    externalUrl: "https://example.com/listing/4",
    title: "Spacious house with garden in Zagreb suburbs",
    listingType: "house",
    price: 1200,
    currency: "EUR",
    areaSqm: 140,
    bedrooms: 4,
    rooms: 6,
    bathrooms: 2,
    address: "Sestinski dol 5, Zagreb",
    cityId: "zagreb",
    cityName: "Zagreb",
    countryId: "hr",
    imageUrls: [],
    scrapedAt: new Date().toISOString(),
  },
];

export function SearchPage() {
  return (
    <div>
      {/* Search bar placeholder */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search city, neighbourhood, or keyword..."
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            readOnly
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Filters and live search coming soon.
        </p>
      </div>

      {/* Results grid */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Listings{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({MOCK_LISTINGS.length} results)
          </span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_LISTINGS.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
