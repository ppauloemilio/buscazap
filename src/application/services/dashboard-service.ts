import type { DashboardStats, Category, Advertisement } from "@/domain/entities";
import type { HomepageSettings } from "@/application/services/homepage-settings-service";
import { getHomepageAdvertisements } from "@/application/services/advertisement-service";
import {
  getCatalogStats,
  getCategoriesWithCounts,
  listCityNamesForSearch,
} from "@/application/services/catalog-service";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { prisma } from "@/lib/prisma";

export interface DashboardData {
  readonly stats: DashboardStats;
  readonly categories: readonly Category[];
  readonly cityNames: readonly string[];
  readonly homeAdvertisements: readonly Advertisement[];
  readonly homepageSettings: HomepageSettings;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [
    homeAdvertisements,
    homepageSettings,
    catalogStats,
    cityNames,
    totalAdvertisements,
    totalProviders,
  ] = await Promise.all([
    getHomepageAdvertisements(),
    getHomepageSettings(),
    getCatalogStats(),
    listCityNamesForSearch(),
    prisma.advertisement.count(),
    prisma.provider.count({ where: { role: "PROVIDER" } }),
  ]);

  const categories = homepageSettings.showPopularCategories
    ? await getCategoriesWithCounts()
    : [];

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
    homepageSettings,
  };
}
