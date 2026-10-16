import Link from "next/link";
import { Search } from "lucide-react";
import type { Advertisement, Category } from "@/domain/entities";
import { PageHeader } from "@/components/layout/page-header";
import { AdvertisementListings } from "@/features/dashboard/components/advertisement-listings";
import { CategoryGrid } from "@/features/dashboard/components/category-grid";
import { SearchFilterSummary } from "@/features/search/components/search-filter-summary";
import { SearchForm } from "@/features/search/components/search-form";
import {
  buildEmptySearchTitle,
  type SearchFilterParams,
} from "@/features/search/utils/search-filter-summary";
import { URGENT_SEARCHES } from "@/config/quick-searches";
import {
  buildSearchHref,
  type SearchPlanFilter,
} from "@/shared/utils/search-preferences";

interface SearchResultsViewProps {
  readonly query?: string;
  readonly city?: string;
  readonly neighborhood?: string;
  readonly categorySlug?: string;
  readonly categoryName?: string;
  readonly premium?: boolean;
  readonly plan?: SearchPlanFilter;
  readonly sort?: string;
  readonly results: readonly Advertisement[];
  readonly popularCategories: readonly Category[];
  readonly cities: readonly string[];
  readonly neighborhoods: readonly string[];
  readonly defaultCityName?: string;
  readonly pageTitle?: string;
  readonly returnTo: string;
}

export function SearchResultsView({
  query = "",
  city = "",
  neighborhood = "",
  categorySlug,
  categoryName,
  premium = false,
  plan,
  sort,
  results,
  popularCategories,
  cities,
  neighborhoods,
  defaultCityName,
  pageTitle = "Buscar",
  returnTo,
}: SearchResultsViewProps) {
  const filterParams: SearchFilterParams = {
    query: query || undefined,
    city: city || undefined,
    neighborhood: neighborhood || undefined,
    categorySlug,
    categoryName,
    premium,
    plan,
    sort,
  };

  const emptyTitle = buildEmptySearchTitle(filterParams);
  const regularTitle =
    plan === "paid"
      ? "Anúncios pagos"
      : plan === "basic"
        ? "Plano Básico"
        : plan === "pro"
          ? "Plano Pro"
          : plan === "free"
            ? "Plano Grátis"
            : "Resultados";

  return (
    <>
      <PageHeader compact title={pageTitle} />
      <section className="container mx-auto space-y-4 px-4 py-5 md:space-y-6 md:py-8">
        <SearchForm
          initialQuery={query}
          initialCity={city}
          initialNeighborhood={neighborhood}
          initialCategory={categorySlug}
          initialPremium={premium}
          initialPlan={plan}
          initialSort={sort}
          cities={cities}
          neighborhoods={neighborhoods}
        />

        <CategoryGrid
          categories={popularCategories}
          embedded
          activeCategorySlug={categorySlug}
          defaultCityName={defaultCityName ?? (city || undefined)}
        />

        <SearchFilterSummary filters={filterParams} count={results.length} />

        {results.length > 0 ? (
          <AdvertisementListings
            advertisements={results}
            regularTitle={regularTitle}
            premiumOnly={premium}
            premiumViewAllHref={
              premium
                ? undefined
                : buildSearchHref({
                    query,
                    city,
                    neighborhood,
                    category: categorySlug,
                    sort,
                    premium: true,
                  })
            }
            paidViewAllHref={
              plan === "paid"
                ? undefined
                : buildSearchHref({
                    query,
                    city,
                    neighborhood,
                    category: categorySlug,
                    sort,
                    plan: "paid",
                  })
            }
            freeViewAllHref={
              plan === "free"
                ? undefined
                : buildSearchHref({
                    query,
                    city,
                    neighborhood,
                    category: categorySlug,
                    sort,
                    plan: "free",
                  })
            }
            returnTo={returnTo}
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
                    city: city || undefined,
                  })}
                  className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-whatsapp hover:bg-whatsapp/5 hover:text-whatsapp"
                >
                  {item.label}
                </Link>
              ))}
              {city ? (
                <Link
                  href={buildSearchHref({
                    query,
                    plan,
                    premium,
                  })}
                  className="rounded-full border border-whatsapp/40 bg-whatsapp/5 px-3 py-1.5 text-xs font-medium text-whatsapp transition-colors hover:bg-whatsapp/10"
                >
                  Buscar sem cidade
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
