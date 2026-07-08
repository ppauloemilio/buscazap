import type { DashboardStats, Category } from "@/domain/entities";
import {
  getPopularAdvertisements,
  getPremiumAdvertisements,
  getRecentAdvertisements,
} from "@/application/services/advertisement-service";
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
  readonly premiumAdvertisements: Awaited<
    ReturnType<typeof getPremiumAdvertisements>
  >;
  readonly recentAdvertisements: Awaited<
    ReturnType<typeof getRecentAdvertisements>
  >;
  readonly popularAdvertisements: Awaited<
    ReturnType<typeof getPopularAdvertisements>
  >;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [
    premiumAdvertisements,
    recentAdvertisements,
    popularAdvertisements,
    categories,
    catalogStats,
    cityNames,
    totalAdvertisements,
    totalProviders,
  ] = await Promise.all([
    getPremiumAdvertisements(),
    getRecentAdvertisements(),
    getPopularAdvertisements(),
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
    premiumAdvertisements,
    recentAdvertisements,
    popularAdvertisements,
  };
}
