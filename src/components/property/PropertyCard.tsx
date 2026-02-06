import { ExternalLink, MapPin, Maximize2, BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RentalListing } from "@/types";

interface PropertyCardProps {
  listing: RentalListing;
  className?: string;
}

export function PropertyCard({ listing, className }: PropertyCardProps) {
  return (
    <div
      className={cn(
        "group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-ring",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {listing.imageUrls.length > 0 ? (
          <img
            src={listing.imageUrls[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {listing.siteName}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-card-foreground">
            {listing.title}
          </h3>
          <a
            href={listing.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Open original listing"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {listing.address && (
          <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {listing.address}
          </p>
        )}

        {/* Meta */}
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {listing.areaSqm && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3 w-3" />
              {listing.areaSqm} m²
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
        </div>

        {/* Price */}
        <p className="text-base font-bold text-primary">
          {listing.currency === "EUR" ? "\u20AC" : listing.currency}{" "}
          {listing.price.toLocaleString()}
          <span className="text-xs font-normal text-muted-foreground">
            /mo
          </span>
        </p>
      </div>
    </div>
  );
}
