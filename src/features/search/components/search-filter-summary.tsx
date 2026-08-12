import Link from "next/link";
import { MapPin, Search, Tag, X } from "lucide-react";
import {
  buildClearAllFiltersHref,
  buildSearchFilterChips,
  buildSearchFilterSummaryText,
  getSearchFilterSummaryVariant,
  hasActiveSearchFilters,
  type SearchFilterParams,
} from "@/features/search/utils/search-filter-summary";
import { cn } from "@/lib/utils";

interface SearchFilterSummaryProps {
  readonly filters: SearchFilterParams;
  readonly count: number;
}

function SummaryIcon({
  variant,
}: {
  readonly variant: ReturnType<typeof getSearchFilterSummaryVariant>;
}) {
  const className = "mt-0.5 h-4 w-4 shrink-0 text-whatsapp";

  if (variant === "query") {
    return <Search className={className} aria-hidden />;
  }

  if (variant === "category") {
    return <Tag className={className} aria-hidden />;
  }

  if (variant === "location") {
    return <MapPin className={className} aria-hidden />;
  }

  return <Search className={className} aria-hidden />;
}

export function SearchFilterSummary({ filters, count }: SearchFilterSummaryProps) {
  if (!hasActiveSearchFilters(filters)) {
    return null;
  }

  const summaryText = buildSearchFilterSummaryText(filters);
  const chips = buildSearchFilterChips(filters);
  const variant = getSearchFilterSummaryVariant(filters);
  const countLabel =
    count === 0
      ? "0 resultados"
      : `${count} ${count === 1 ? "anúncio" : "anúncios"}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <SummaryIcon variant={variant} />
          <div className="min-w-0">
            <p className="text-sm leading-snug text-foreground">
              <span className="font-medium">
                {count === 0 ? "Nenhum resultado:" : "Mostrando:"}
              </span>{" "}
              {summaryText}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{countLabel}</p>
          </div>
        </div>

        <Link
          href={buildClearAllFiltersHref()}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-whatsapp transition-colors hover:bg-whatsapp/10"
        >
          Limpar
          <X className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {chips.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <Link
              key={chip.id}
              href={chip.clearHref}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors",
                "hover:border-whatsapp/40 hover:bg-whatsapp/5 hover:text-whatsapp"
              )}
            >
              {chip.label}
              <X className="h-3 w-3 opacity-60" aria-hidden />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
