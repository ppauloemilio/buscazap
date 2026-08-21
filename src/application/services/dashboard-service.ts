import type { DashboardStats, Category, Advertisement } from "@/domain/entities";
import type { HomepageSettings } from "@/application/services/homepage-settings-service";
import { getHomepageAdvertisements } from "@/application/services/advertisement-service";
import {
  getCategoriesWithCounts,
  listCityNamesForSearch,
  listNeighborhoodsByCityForSearch,
} from "@/application/services/catalog-service";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { prisma } from "@/lib/prisma";

export interface DashboardData {
  readonly stats: DashboardStats;
  readonly categories: readonly Category[];
  readonly cityNames: readonly string[];
  readonly neighborhoodsByCity: ReadonlyArray<{
    readonly city: string;
    readonly neighborhoods: readonly string[];
  }>;
  readonly homeAdvertisements: readonly Advertisement[];
  readonly homepageSettings: HomepageSettings;
}

const EMPTY_STATS: DashboardStats = {
  totalAdvertisements: 0,
  totalProviders: 0,
  totalCities: 0,
  totalCategories: 0,
};

export async function getDashboardData(options?: {
  readonly includeStats?: boolean;
}): Promise<DashboardData> {
  const includeStats = options?.includeStats ?? false;

  // Dois lotes em vez de 8 queries em paralelo (menos pressão no pool).
  const [homeAdvertisements, homepageSettings, categories] = await Promise.all([
    getHomepageAdvertisements(),
    getHomepageSettings(),
    getCategoriesWithCounts(),
  ]);

  const [cityNames, neighborhoodsByCity] = await Promise.all([
    listCityNamesForSearch(),
    listNeighborhoodsByCityForSearch(),
  ]);

  let stats = EMPTY_STATS;

  if (includeStats) {
    const [totalAdvertisements, totalProviders, totalCities, totalCategories] =
      await Promise.all([
        prisma.advertisement.count(),
        prisma.provider.count({ where: { role: "PROVIDER" } }),
        prisma.catalogCity.count({ where: { isActive: true } }),
        prisma.catalogCategory.count({ where: { isActive: true } }),
      ]);

    stats = {
      totalAdvertisements,
      totalProviders,
      totalCities,
      totalCategories,
    };
  }

  return {
    stats,
    categories,
    cityNames,
    neighborhoodsByCity,
    homeAdvertisements,
    homepageSettings,
  };
}
