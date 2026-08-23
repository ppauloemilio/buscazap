import { unstable_cache } from "next/cache";
import type { Category } from "@/domain/entities";
import { prisma } from "@/lib/prisma";
import { publicListingAdvertisementWhere } from "@/lib/public-advertisement-visibility";

const CATALOG_REVALIDATE_SECONDS = 120;

export type PublicSearchCatalog = {
  readonly categories: readonly Category[];
  readonly cityNames: readonly string[];
  readonly neighborhoodsByCity: ReadonlyArray<{
    readonly city: string;
    readonly neighborhoods: readonly string[];
  }>;
  readonly categorySlugByName: ReadonlyMap<string, string>;
};

async function loadPublicSearchCatalog(): Promise<PublicSearchCatalog> {
  const listingWhere = publicListingAdvertisementWhere();

  const [catalogCategories, categoryCounts, cityGrouped, neighborhoodGrouped] =
    await Promise.all([
      prisma.catalogCategory.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.advertisement.groupBy({
        by: ["category"],
        _count: { category: true },
        where: listingWhere,
      }),
      prisma.advertisement.groupBy({
        by: ["city"],
        where: listingWhere,
      }),
      prisma.advertisement.groupBy({
        by: ["city", "neighborhood"],
        where: {
          ...listingWhere,
          neighborhood: { not: null },
        },
      }),
    ]);

  const counts = new Map(
    categoryCounts.map((item) => [item.category, item._count.category])
  );

  const categories: Category[] = catalogCategories
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      count: counts.get(category.name) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const cityNames = Array.from(
    new Set(
      cityGrouped.map((item) => item.city.trim()).filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const byCity = new Map<string, Set<string>>();

  for (const row of neighborhoodGrouped) {
    const city = row.city.trim();
    const neighborhood = row.neighborhood?.trim();
    if (!city || !neighborhood) continue;

    const set = byCity.get(city) ?? new Set<string>();
    set.add(neighborhood);
    byCity.set(city, set);
  }

  const neighborhoodsByCity = Array.from(byCity.entries())
    .map(([city, set]) => ({
      city,
      neighborhoods: Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR")),
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "pt-BR"));

  const categorySlugByName = new Map(
    catalogCategories.map((category) => [category.name, category.slug])
  );

  return {
    categories,
    cityNames,
    neighborhoodsByCity,
    categorySlugByName,
  };
}

export const getPublicSearchCatalog = unstable_cache(
  loadPublicSearchCatalog,
  ["public-search-catalog"],
  { revalidate: CATALOG_REVALIDATE_SECONDS }
);

export function neighborhoodNamesFromCatalog(
  catalog: PublicSearchCatalog,
  city?: string
): readonly string[] {
  const cityFilter = city?.trim();
  if (!cityFilter) {
    const all = new Set<string>();
    for (const group of catalog.neighborhoodsByCity) {
      for (const name of group.neighborhoods) {
        all.add(name);
      }
    }
    return Array.from(all).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");

  const cityQuery = normalize(cityFilter);

  const names = new Set<string>();
  for (const group of catalog.neighborhoodsByCity) {
    if (!normalize(group.city).includes(cityQuery)) continue;
    for (const name of group.neighborhoods) {
      names.add(name);
    }
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function categoryNameFromCatalog(
  catalog: PublicSearchCatalog,
  slug: string
): string | undefined {
  const match = catalog.categories.find((category) => category.slug === slug);
  return match?.name;
}
