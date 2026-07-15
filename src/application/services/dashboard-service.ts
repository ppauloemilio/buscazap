import type { DashboardStats, Category, Advertisement } from "@/domain/entities";
import type { HomepageSettings } from "@/application/services/homepage-settings-service";
import { getHomepageAdvertisements } from "@/application/services/advertisement-service";
import {
  getCatalogStats,
  getCategoriesWithCounts,
  listCityNamesForSearch,
} from "@/application/services/catalog-service";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { PILOT_CITIES } from "@/config/pricing";
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
    totalAdvertisements,
    totalProviders,
    categories,
    cityNames,
  ] = await Promise.all([
    getHomepageAdvertisements(),
    getHomepageSettings(),
    getCatalogStats(),
    prisma.advertisement.count(),
    prisma.provider.count({ where: { role: "PROVIDER" } }),
    getCategoriesWithCounts(),
    listCityNamesForSearch(),
  ]);

  return {
    stats: {
      totalAdvertisements,
      totalProviders,
      totalCities: Math.max(catalogStats.citiesCount, PILOT_CITIES.length),
      totalCategories: catalogStats.categoriesCount,
    },
    categories,
    cityNames,
    homeAdvertisements,
    homepageSettings,
  };
}
