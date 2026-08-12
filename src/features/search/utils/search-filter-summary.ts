import { buildSearchHref } from "@/shared/utils/search-preferences";

export interface SearchFilterParams {
  readonly query?: string;
  readonly city?: string;
  readonly neighborhood?: string;
  readonly categorySlug?: string;
  readonly categoryName?: string;
  readonly premium?: boolean;
  readonly sort?: string;
}

export interface SearchFilterChip {
  readonly id: string;
  readonly label: string;
  readonly clearHref: string;
}

function buildHref(
  filters: SearchFilterParams,
  omit?: keyof SearchFilterParams
): string {
  const next = {
    query: omit === "query" ? undefined : filters.query,
    city: omit === "city" ? undefined : filters.city,
    neighborhood:
      omit === "neighborhood" || omit === "city"
        ? undefined
        : filters.neighborhood,
    categorySlug: omit === "categorySlug" ? undefined : filters.categorySlug,
    premium: omit === "premium" ? undefined : filters.premium,
    sort: filters.sort,
  };

  const href = buildSearchHref({
    query: next.query,
    city: next.city,
    neighborhood: next.neighborhood,
    category: next.categorySlug,
  });

  const params = new URLSearchParams(
    href.includes("?") ? href.split("?")[1] : ""
  );

  if (next.premium) params.set("premium", "true");
  if (next.sort?.trim()) params.set("sort", next.sort.trim());

  const qs = params.toString();
  return qs ? `/buscar?${qs}` : "/buscar";
}

export function hasActiveSearchFilters(filters: SearchFilterParams): boolean {
  return Boolean(
    filters.query?.trim() ||
      filters.city?.trim() ||
      filters.neighborhood?.trim() ||
      filters.categorySlug?.trim() ||
      filters.premium
  );
}

function buildLocationPhrase(filters: SearchFilterParams): string | undefined {
  if (filters.neighborhood?.trim() && filters.city?.trim()) {
    return `no bairro ${filters.neighborhood.trim()}, ${filters.city.trim()}`;
  }

  if (filters.neighborhood?.trim()) {
    return `no bairro ${filters.neighborhood.trim()}`;
  }

  if (filters.city?.trim()) {
    return `em ${filters.city.trim()}`;
  }

  return undefined;
}

function buildFilterPhrase(filters: SearchFilterParams): string {
  const query = filters.query?.trim();
  const category = filters.categoryName?.trim();
  const location = buildLocationPhrase(filters);
  const premiumSuffix = filters.premium ? " · destaque premium" : "";

  if (query && category && location) {
    return `"${query}" em ${category} ${location}${premiumSuffix}`;
  }

  if (query && category) {
    return `"${query}" em ${category}${premiumSuffix}`;
  }

  if (query && location) {
    return `"${query}" ${location}${premiumSuffix}`;
  }

  if (category && location) {
    return `${category} ${location}${premiumSuffix}`;
  }

  if (query) {
    return `"${query}"${premiumSuffix}`;
  }

  if (category) {
    return category + premiumSuffix;
  }

  if (location) {
    return `anúncios ${location}${premiumSuffix}`;
  }

  if (filters.premium) {
    return "anúncios em destaque premium";
  }

  return "filtros selecionados";
}

export function buildSearchFilterSummaryText(
  filters: SearchFilterParams
): string {
  return buildFilterPhrase(filters);
}

export function buildEmptySearchTitle(filters: SearchFilterParams): string {
  const phrase = buildFilterPhrase(filters);

  if (phrase === "filtros selecionados") {
    return "Nenhum anúncio encontrado";
  }

  return `Nenhum resultado para ${phrase}`;
}

export function buildSearchFilterChips(
  filters: SearchFilterParams
): readonly SearchFilterChip[] {
  const chips: SearchFilterChip[] = [];

  if (filters.query?.trim()) {
    chips.push({
      id: "query",
      label: `"${filters.query.trim()}"`,
      clearHref: buildHref(filters, "query"),
    });
  }

  if (filters.categorySlug?.trim() && filters.categoryName?.trim()) {
    chips.push({
      id: "category",
      label: filters.categoryName.trim(),
      clearHref: buildHref(filters, "categorySlug"),
    });
  }

  if (filters.neighborhood?.trim()) {
    chips.push({
      id: "neighborhood",
      label: filters.neighborhood.trim(),
      clearHref: buildHref(filters, "neighborhood"),
    });
  }

  if (filters.city?.trim()) {
    chips.push({
      id: "city",
      label: filters.city.trim(),
      clearHref: buildHref(filters, "city"),
    });
  }

  if (filters.premium) {
    chips.push({
      id: "premium",
      label: "Destaque premium",
      clearHref: buildHref(filters, "premium"),
    });
  }

  return chips;
}

export function buildClearAllFiltersHref(): string {
  return "/buscar";
}

export type SearchFilterSummaryVariant = "query" | "category" | "location" | "mixed";

export function getSearchFilterSummaryVariant(
  filters: SearchFilterParams
): SearchFilterSummaryVariant {
  const hasQuery = Boolean(filters.query?.trim());
  const hasCategory = Boolean(filters.categorySlug?.trim());
  const hasLocation = Boolean(
    filters.city?.trim() || filters.neighborhood?.trim()
  );

  const kinds = [hasQuery, hasCategory, hasLocation].filter(Boolean).length;

  if (kinds >= 2) return "mixed";
  if (hasQuery) return "query";
  if (hasCategory) return "category";
  if (hasLocation) return "location";
  return "mixed";
}
