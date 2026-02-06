import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="mb-3 text-4xl font-bold tracking-tight">LocalRent</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        Compare rental listings across multiple local sites. One search, every
        listing.
      </p>
      <Link
        to="/search"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Search className="h-4 w-4" />
        Start Searching
      </Link>
    </div>
  );
}
