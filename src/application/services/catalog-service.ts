import type { Category } from "@/domain/entities";
import { prisma } from "@/lib/prisma";
import { markDataFetchDynamic } from "@/lib/db";
import { publicListingAdvertisementWhere } from "@/lib/public-advertisement-visibility";

export async function listActiveCategories() {
  markDataFetchDynamic();

  return prisma.catalogCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listAllCategories() {
  return prisma.catalogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.catalogCategory.findFirst({
    where: {
      slug,
      isActive: true,
    },
  });
}

export async function getCategoryNameBySlug(slug: string) {
  const category = await getCategoryBySlug(slug);
  return category?.name;
}

export async function listActiveStates() {
  markDataFetchDynamic();

  return prisma.catalogState.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listAllStates() {
  return prisma.catalogState.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listActiveCities(stateId?: string) {
  markDataFetchDynamic();

  return prisma.catalogCity.findMany({
    where: {
      isActive: true,
      ...(stateId ? { stateId } : {}),
    },
    include: {
      state: {
        select: { uf: true, name: true },
      },
    },
    orderBy: [{ name: "asc" }],
  });
}

export async function listAllCities(stateId?: string) {
  return prisma.catalogCity.findMany({
    where: stateId ? { stateId } : undefined,
    include: {
      state: {
        select: { uf: true, name: true },
      },
    },
    orderBy: [{ name: "asc" }],
  });
}

export async function listCityNamesForSearch() {
  markDataFetchDynamic();

  const grouped = await prisma.advertisement.groupBy({
    by: ["city"],
    where: publicListingAdvertisementWhere(),
  });

  const names = grouped
    .map((item) => item.city.trim())
    .filter(Boolean);

  return Array.from(new Set(names)).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

export async function listNeighborhoodNamesForSearch(city?: string) {
  markDataFetchDynamic();

  const cityFilter = city?.trim();
  const rows = await prisma.advertisement.findMany({
    where: {
      ...publicListingAdvertisementWhere(),
      neighborhood: { not: null },
    },
    select: { city: true, neighborhood: true },
  });

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");

  const cityQuery = cityFilter ? normalize(cityFilter) : null;

  const names = rows
    .filter((row) => {
      if (!row.neighborhood?.trim()) return false;
      if (!cityQuery) return true;
      return normalize(row.city).includes(cityQuery);
    })
    .map((row) => row.neighborhood!.trim());

  return Array.from(new Set(names)).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

export async function listNeighborhoodsByCityForSearch(): Promise<
  ReadonlyArray<{ readonly city: string; readonly neighborhoods: readonly string[] }>
> {
  markDataFetchDynamic();

  const rows = await prisma.advertisement.findMany({
    where: {
      ...publicListingAdvertisementWhere(),
      neighborhood: { not: null },
    },
    select: { city: true, neighborhood: true },
  });

  const byCity = new Map<string, Set<string>>();

  for (const row of rows) {
    const neighborhood = row.neighborhood?.trim();
    const city = row.city.trim();
    if (!neighborhood || !city) continue;

    const set = byCity.get(city) ?? new Set<string>();
    set.add(neighborhood);
    byCity.set(city, set);
  }

  return Array.from(byCity.entries())
    .map(([city, set]) => ({
      city,
      neighborhoods: Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR")),
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "pt-BR"));
}

export async function getCategoriesWithCounts(): Promise<Category[]> {
  const [categories, grouped] = await Promise.all([
    listActiveCategories(),
    prisma.advertisement.groupBy({
      by: ["category"],
      _count: { category: true },
      where: publicListingAdvertisementWhere(),
    }),
  ]);

  const counts = new Map(
    grouped.map((item) => [item.category, item._count.category])
  );

  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      count: counts.get(category.name) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function getCatalogStats() {
  const [categoriesCount, statesCount, citiesCount] = await Promise.all([
    prisma.catalogCategory.count({ where: { isActive: true } }),
    prisma.catalogState.count({ where: { isActive: true } }),
    prisma.catalogCity.count({ where: { isActive: true } }),
  ]);

  return {
    categoriesCount,
    statesCount,
    citiesCount,
  };
}
