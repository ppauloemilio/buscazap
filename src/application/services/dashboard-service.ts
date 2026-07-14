import type { DashboardStats, Category, Advertisement } from "@/domain/entities";
import { getHomepageAdvertisements } from "@/application/services/advertisement-service";
import {
  getCatalogStats,
  getCategoriesWithCounts,
  listCityNamesForSearch,
} from "@/application/services/catalog-service";
import { prisma } from "@/lib/prisma";

export interface DashboardData {
  readonly stats: DashboardStats;
  readonly categories: readonly Category[];
  readonly cityNames: readonly string[];
  readonly homeAdvertisements: readonly Advertisement[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [
    homeAdvertisements,
    categories,
    catalogStats,
    cityNames,
    totalAdvertisements,
    totalProviders,
  ] = await Promise.all([
    getHomepageAdvertisements(),
    getCategoriesWithCounts(),
    getCatalogStats(),
    listCityNamesForSearch(),
    prisma.advertisement.count(),
    prisma.provider.count({ where: { role: "PROVIDER" } }),
  ]);

  return {
    stats: {
      totalAdvertisements,
      totalProviders,
      totalCities: catalogStats.citiesCount,
      totalCategories: catalogStats.categoriesCount,
    },
    categories,
    cityNames,
    homeAdvertisements,
  };
}
