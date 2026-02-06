import { ExternalLink, MapPin, Maximize2, BedDouble, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RentalListing } from "@/types";
import type { PriceFlag } from "@/lib/search/types";

interface PropertyCardProps {
  listing: RentalListing;
  confidence?: number;
  priceFlags?: PriceFlag[];
  className?: string;
}

export function PropertyCard({
  listing,
  confidence,
  priceFlags = [],
  className,
}: PropertyCardProps) {
  const hasWarnings = priceFlags.length > 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:border-ring hover:shadow-lg hover:shadow-black/10",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {listing.imageUrls.length > 0 ? (
          <img
            src={listing.imageUrls[0]}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary/50">
            <div className="text-center text-muted-foreground">
              <Maximize2 className="mx-auto mb-1 h-6 w-6 opacity-40" />
              <span className="text-xs">No image</span>
            </div>
          </div>
        )}

        {/* Top badges row */}
        <div className="absolute left-2 right-2 top-2 flex items-start justify-between">
          <span className="rounded bg-secondary/90 px-2 py-0.5 text-xs font-medium text-secondary-foreground backdrop-blur-sm">
            {listing.siteName}
          </span>

          {confidence !== undefined && (
            <ConfidenceBadge value={confidence} />
          )}
        </div>

        {/* Price warning overlay */}
        {hasWarnings && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              {formatPriceFlag(priceFlags[0])}
            </span>
          </div>
        )}

        {/* Image count badge */}
        {listing.imageUrls.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white/90 backdrop-blur-sm">
            1/{listing.imageUrls.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground">
            {listing.title}
          </h3>
          <a
            href={listing.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Open original listing"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {listing.address && (
          <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{listing.address}</span>
          </p>
        )}

        {/* Meta row */}
        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {listing.areaSqm && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3 w-3" />
              {listing.areaSqm} m{"\u00B2"}
            </span>
          )}
          {listing.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              {listing.bedrooms} bed{listing.bedrooms !== 1 ? "s" : ""}
            </span>
          )}
          {listing.rooms !== undefined && (
            <span>{listing.rooms} room{listing.rooms !== 1 ? "s" : ""}</span>
          )}
          {listing.listingType && (
            <span className="rounded bg-muted px-1.5 py-0.5 capitalize">
              {listing.listingType}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between">
          <p className={cn(
            "text-base font-bold",
            hasWarnings ? "text-amber-400" : "text-primary"
          )}>
            {formatCurrency(listing.price, listing.currency)}
            <span className="text-xs font-normal text-muted-foreground">
              /mo
            </span>
          </p>

          {listing.priceUsd !== undefined && listing.currency !== "USD" && (
            <span className="text-xs text-muted-foreground">
              ~${listing.priceUsd.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ConfidenceBadge({ value }: { value: number }) {
  let color: string;
  if (value >= 70) color = "text-emerald-400 bg-emerald-950/80";
  else if (value >= 40) color = "text-amber-400 bg-amber-950/80";
  else color = "text-red-400 bg-red-950/80";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm",
        color
      )}
      title={`Data confidence: ${value}%`}
    >
      <ShieldCheck className="h-3 w-3" />
      {value}
    </span>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { EUR: "\u20AC", USD: "$", GBP: "\u00A3", HRK: "kn" };
  const symbol = symbols[currency] ?? currency;
  return `${symbol}${amount.toLocaleString()}`;
}

function formatPriceFlag(flag: PriceFlag): string {
  const labels: Record<PriceFlag, string> = {
    price_too_low: "Unusually low price",
    price_too_high: "Unusually high price",
    price_is_weekly: "May be weekly rate",
    price_is_daily: "May be nightly rate",
    price_is_total: "May be total price",
    price_missing_cents: "Price may be truncated",
    currency_mismatch: "Currency mismatch",
  };
  return labels[flag];
}
