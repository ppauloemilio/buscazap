import type { Metadata } from "next";
import { getPopularCategories } from "@/application/services/analytics-service";
import { searchAdvertisements } from "@/application/services/search-service";
import {
  categoryNameFromCatalog,
  categorySlugMap,
  getPublicSearchCatalog,
  neighborhoodNamesFromCatalog,
} from "@/lib/public-search-catalog";
import { SearchResultsView } from "@/features/search/components/search-results-view";
import {
  buildSearchHref,
  type SearchPlanFilter,
} from "@/shared/utils/search-preferences";

interface SearchPageProps {
  readonly searchParams: Promise<{
    readonly q?: string;
    readonly city?: string;
    readonly neighborhood?: string;
    readonly category?: string;
    readonly type?: string;
    readonly premium?: string;
    readonly plan?: string;
    readonly sort?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Buscar WhatsApp, telefone e contatos",
  description:
    "Busque empresas, prestadores e serviços por WhatsApp, telefone ou Zap na sua cidade no BuscaZapp.",
};

function parsePlanFilter(value: string | undefined): SearchPlanFilter | undefined {
  if (
    value === "paid" ||
    value === "free" ||
    value === "basic" ||
    value === "pro"
  ) {
    return value;
  }
  return undefined;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const isPremium = params.premium === "true";
  const plan = isPremium ? undefined : parsePlanFilter(params.plan);

  const catalogPromise = getPublicSearchCatalog();
  const [catalog, results, popularCategories] = await Promise.all([
    catalogPromise,
    catalogPromise.then((catalog) =>
      searchAdvertisements({
        query: params.q ?? "",
        city: params.city,
        neighborhood: params.neighborhood,
        category: params.category,
        premium: isPremium,
        plan,
        sort: params.sort,
        knownCategorySlugs: categorySlugMap(catalog),
      })
    ),
    catalogPromise.then((catalog) => getPopularCategories(catalog.categories)),
  ]);

  const categoryName = params.category
    ? categoryNameFromCatalog(catalog, params.category) ?? params.category
    : undefined;

  const cityNames = catalog.cityNames;
  const neighborhoods = neighborhoodNamesFromCatalog(catalog, params.city);
  const defaultCityName =
    (params.city &&
      cityNames.find(
        (name) =>
          name.localeCompare(params.city!, "pt-BR", { sensitivity: "base" }) ===
          0
      )) ||
    cityNames.find(
      (name) =>
        name.localeCompare("Belém", "pt-BR", { sensitivity: "base" }) === 0
    ) ||
    cityNames[0];

  const searchReturnPath = buildSearchHref({
    query: params.q,
    city: params.city,
    neighborhood: params.neighborhood,
    category: params.category,
    type: params.type,
    premium: isPremium,
    plan,
    sort: params.sort,
  });

  return (
    <SearchResultsView
      query={params.q ?? ""}
      city={params.city ?? ""}
      neighborhood={params.neighborhood ?? ""}
      categorySlug={params.category}
      categoryName={categoryName}
      premium={isPremium}
      plan={plan}
      sort={params.sort}
      results={results}
      popularCategories={popularCategories}
      cities={cityNames}
      neighborhoods={neighborhoods}
      defaultCityName={defaultCityName}
      returnTo={searchReturnPath}
    />
  );
}
