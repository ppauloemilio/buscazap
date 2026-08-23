import type { Category } from "@/domain/entities";
import { prisma } from "@/lib/prisma";
import { markDataFetchDynamic } from "@/lib/db";
import { publicListingAdvertisementWhere } from "@/lib/public-advertisement-visibility";
import {
  getPublicSearchCatalog,
  neighborhoodNamesFromCatalog,
} from "@/lib/public-search-catalog";

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
  const catalog = await getPublicSearchCatalog();
  return catalog.cityNames;
}

export async function listNeighborhoodNamesForSearch(city?: string) {
  const catalog = await getPublicSearchCatalog();
  return neighborhoodNamesFromCatalog(catalog, city);
}

export async function listNeighborhoodsByCityForSearch(): Promise<
  ReadonlyArray<{ readonly city: string; readonly neighborhoods: readonly string[] }>
> {
  const catalog = await getPublicSearchCatalog();
  return catalog.neighborhoodsByCity;
}

export async function getCategoriesWithCounts(): Promise<readonly Category[]> {
  const catalog = await getPublicSearchCatalog();
  return catalog.categories;
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
