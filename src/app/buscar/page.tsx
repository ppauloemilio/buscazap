import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getPopularCategories } from "@/application/services/analytics-service";
import { searchAdvertisements } from "@/application/services/search-service";
import {
  categoryNameFromCatalog,
  categorySlugMap,
  getPublicSearchCatalog,
  neighborhoodNamesFromCatalog,
} from "@/lib/public-search-catalog";
import { PageHeader } from "@/components/layout/page-header";
import { AdvertisementListings } from "@/features/dashboard/components/advertisement-listings";
import { CategoryGrid } from "@/features/dashboard/components/category-grid";
import { SearchFilterSummary } from "@/features/search/components/search-filter-summary";
import { SearchForm } from "@/features/search/components/search-form";
import { buildEmptySearchTitle } from "@/features/search/utils/search-filter-summary";
import { URGENT_SEARCHES } from "@/config/quick-searches";
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
  title: "Buscar",
};

function parsePlanFilter(value: string | undefined): SearchPlanFilter | undefined {
  if (value === "paid" || value === "free") {
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

  const filterParams = {
    query: params.q,
    city: params.city,
    neighborhood: params.neighborhood,
    categorySlug: params.category,
    categoryName,
    premium: isPremium,
    plan,
    sort: params.sort,
  };

  const emptyTitle = buildEmptySearchTitle(filterParams);
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

  const regularTitle =
    plan === "paid"
      ? "Anúncios"
      : plan === "free"
        ? "Listagens grátis"
        : "Resultados";

  return (
    <>
      <PageHeader compact title="Buscar" />
      <section className="container mx-auto space-y-4 px-4 py-5 md:space-y-6 md:py-8">
        <SearchForm
          initialQuery={params.q ?? ""}
          initialCity={params.city ?? ""}
          initialNeighborhood={params.neighborhood ?? ""}
          initialCategory={params.category}
          initialPremium={isPremium}
          initialPlan={plan}
          initialSort={params.sort}
          cities={cityNames}
          neighborhoods={neighborhoods}
        />

        <CategoryGrid
          categories={popularCategories}
          embedded
          activeCategorySlug={params.category}
        />

        <SearchFilterSummary filters={filterParams} count={results.length} />

        {results.length > 0 ? (
          <AdvertisementListings
            advertisements={results}
            regularTitle={regularTitle}
            premiumOnly={isPremium}
            premiumViewAllHref={
              isPremium
                ? undefined
                : buildSearchHref({
                    query: params.q,
                    city: params.city,
                    neighborhood: params.neighborhood,
                    category: params.category,
                    sort: params.sort,
                    premium: true,
                  })
            }
            paidViewAllHref={
              plan === "paid"
                ? undefined
                : buildSearchHref({
                    query: params.q,
                    city: params.city,
                    neighborhood: params.neighborhood,
                    category: params.category,
                    sort: params.sort,
                    plan: "paid",
                  })
            }
            freeViewAllHref={
              plan === "free"
                ? undefined
                : buildSearchHref({
                    query: params.q,
                    city: params.city,
                    neighborhood: params.neighborhood,
                    category: params.category,
                    sort: params.sort,
                    plan: "free",
                  })
            }
            returnTo={searchReturnPath}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-12 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">{emptyTitle}</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Conhece alguém? Indique ou cadastre um anúncio e ajude a completar
              a região. Você também pode limpar os filtros ou tentar uma busca
              rápida abaixo.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href="/buscar"
                className="inline-flex h-10 items-center justify-center rounded-md border px-5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Limpar filtros
              </Link>
              <Link
                href="/anunciar"
                className="inline-flex h-10 items-center justify-center rounded-md bg-whatsapp px-5 text-sm font-medium text-whatsapp-foreground transition-colors hover:bg-whatsapp/90"
              >
                Anunciar no BuscaZapp
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {URGENT_SEARCHES.map((item) => (
                <Link
                  key={item.label}
                  href={buildSearchHref({
                    query: item.query,
                    city: params.city,
                  })}
                  className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-whatsapp hover:bg-whatsapp/5 hover:text-whatsapp"
                >
                  {item.label}
                </Link>
              ))}
              {params.city && (
                <Link
                  href={buildSearchHref({ query: params.q, plan, premium: isPremium })}
                  className="rounded-full border border-whatsapp/40 bg-whatsapp/5 px-3 py-1.5 text-xs font-medium text-whatsapp transition-colors hover:bg-whatsapp/10"
                >
                  Buscar sem cidade
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
