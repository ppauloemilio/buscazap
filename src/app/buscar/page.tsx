import type { Metadata } from "next";
import { Search } from "lucide-react";
import { AdvertisementType } from "@/domain/enums";
import {
  getCategoryNameBySlug,
  searchAdvertisements,
} from "@/application/services/search-service";
import { listCityNamesForSearch } from "@/application/services/catalog-service";
import { PageHeader } from "@/components/layout/page-header";
import { AdvertisementCard } from "@/features/dashboard/components/advertisement-card";
import { SearchForm } from "@/features/search/components/search-form";

interface SearchPageProps {
  readonly searchParams: Promise<{
    readonly q?: string;
    readonly city?: string;
    readonly category?: string;
    readonly type?: string;
    readonly premium?: string;
    readonly sort?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Buscar",
};

function buildDescription(
  count: number,
  query?: string,
  city?: string,
  category?: string
): string {
  const parts: string[] = [];

  if (query) parts.push(`"${query}"`);
  if (category) parts.push(`em ${category}`);
  if (city) parts.push(`na cidade de ${city}`);

  if (parts.length === 0) {
    return `${count} anúncio(s) encontrado(s)`;
  }

  return `${count} resultado(s) para ${parts.join(" ")}`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [categoryName, cityNames] = await Promise.all([
    params.category
      ? getCategoryNameBySlug(params.category).then(
          (name) => name ?? params.category
        )
      : Promise.resolve(undefined),
    listCityNamesForSearch(),
  ]);

  const type =
    params.type && params.type in AdvertisementType
      ? (params.type as AdvertisementType)
      : undefined;

  const results = await searchAdvertisements({
    query: params.q ?? "",
    city: params.city,
    category: params.category,
    type,
    premium: params.premium === "true",
    sort: params.sort,
  });

  const description = buildDescription(
    results.length,
    params.q,
    params.city,
    categoryName
  );

  return (
    <>
      <PageHeader title="Resultados da busca" description={description} />
      <section className="container mx-auto space-y-8 px-4 py-8">
        <SearchForm
          initialQuery={params.q ?? ""}
          initialCity={params.city ?? ""}
          initialType={params.type ?? "all"}
          initialCategory={params.category}
          initialPremium={params.premium === "true"}
          initialSort={params.sort}
          cities={cityNames}
        />

        {results.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {results.map((ad) => (
              <AdvertisementCard key={ad.id} advertisement={ad} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-16 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Nenhum anúncio encontrado
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Tente ajustar os filtros ou buscar por outro termo, cidade ou
              categoria.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
