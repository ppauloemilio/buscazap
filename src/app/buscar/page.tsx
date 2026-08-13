import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  getCategoryNameBySlug,
  searchAdvertisements,
} from "@/application/services/search-service";
import {
  getCategoriesWithCounts,
  listCityNamesForSearch,
  listNeighborhoodNamesForSearch,
} from "@/application/services/catalog-service";
import { PageHeader } from "@/components/layout/page-header";
import { AdvertisementCard } from "@/features/dashboard/components/advertisement-card";
import { SearchFilterSummary } from "@/features/search/components/search-filter-summary";
import { SearchForm } from "@/features/search/components/search-form";
import { buildEmptySearchTitle } from "@/features/search/utils/search-filter-summary";
import { URGENT_SEARCHES } from "@/config/quick-searches";
import { buildSearchHref } from "@/shared/utils/search-preferences";

interface SearchPageProps {
  readonly searchParams: Promise<{
    readonly q?: string;
    readonly city?: string;
    readonly neighborhood?: string;
    readonly category?: string;
    readonly type?: string;
    readonly premium?: string;
    readonly sort?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Buscar",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [categoryName, cityNames, neighborhoods, categories, results] =
    await Promise.all([
      params.category
        ? getCategoryNameBySlug(params.category).then(
            (name) => name ?? params.category
          )
        : Promise.resolve(undefined),
      listCityNamesForSearch(),
      listNeighborhoodNamesForSearch(params.city),
      getCategoriesWithCounts(),
      searchAdvertisements({
        query: params.q ?? "",
        city: params.city,
        neighborhood: params.neighborhood,
        category: params.category,
        premium: params.premium === "true",
        sort: params.sort,
      }),
    ]);

  const filterParams = {
    query: params.q,
    city: params.city,
    neighborhood: params.neighborhood,
    categorySlug: params.category,
    categoryName,
    premium: params.premium === "true",
    sort: params.sort,
  };

  const emptyTitle = buildEmptySearchTitle(filterParams);
  const searchReturnPath = buildSearchHref({
    query: params.q,
    city: params.city,
    neighborhood: params.neighborhood,
    category: params.category,
    type: params.type,
    premium: params.premium === "true",
    sort: params.sort,
  });

  return (
    <>
      <PageHeader compact title="Buscar" />
      <section className="container mx-auto space-y-4 px-4 py-5 md:space-y-6 md:py-8">
        <SearchForm
          initialQuery={params.q ?? ""}
          initialCity={params.city ?? ""}
          initialNeighborhood={params.neighborhood ?? ""}
          initialCategory={params.category}
          initialPremium={params.premium === "true"}
          initialSort={params.sort}
          cities={cityNames}
          neighborhoods={neighborhoods}
          categories={categories.map((item) => ({
            name: item.name,
            slug: item.slug,
            icon: item.icon,
          }))}
        />

        <SearchFilterSummary filters={filterParams} count={results.length} />

        {results.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {results.map((ad) => (
              <AdvertisementCard
                key={ad.id}
                advertisement={ad}
                returnTo={searchReturnPath}
              />
            ))}
          </div>
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
                href="/parceiro"
                className="inline-flex h-10 items-center justify-center rounded-md bg-whatsapp px-5 text-sm font-medium text-whatsapp-foreground transition-colors hover:bg-whatsapp/90"
              >
                Indicar / anunciar no BuscaZapp
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
                  href={buildSearchHref({ query: params.q })}
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
