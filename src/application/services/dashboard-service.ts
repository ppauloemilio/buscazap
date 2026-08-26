import type { DashboardStats, Category, Advertisement } from "@/domain/entities";
import type { HomepageSettings } from "@/application/services/homepage-settings-service";
import { getHomepageAdvertisements } from "@/application/services/advertisement-service";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  getHomepageSettings,
} from "@/application/services/homepage-settings-service";
import { getPublicSearchCatalog, categorySlugMap } from "@/lib/public-search-catalog";
import { prisma } from "@/lib/prisma";

export interface DashboardData {
  readonly stats: DashboardStats;
  readonly categories: readonly Category[];
  readonly cityNames: readonly string[];
  readonly neighborhoodsByCity: ReadonlyArray<{
    readonly city: string;
    readonly neighborhoods: readonly string[];
  }>;
  readonly homePremiumAdvertisements: readonly Advertisement[];
  readonly homeRegularAdvertisements: readonly Advertisement[];
  readonly homepageSettings: HomepageSettings;
}

const EMPTY_STATS: DashboardStats = {
  totalAdvertisements: 0,
  totalProviders: 0,
  totalCities: 0,
  totalCategories: 0,
};

const EMPTY_DASHBOARD: DashboardData = {
  stats: EMPTY_STATS,
  categories: [],
  cityNames: [],
  neighborhoodsByCity: [],
  homePremiumAdvertisements: [],
  homeRegularAdvertisements: [],
  homepageSettings: DEFAULT_HOMEPAGE_SETTINGS,
};

async function loadDashboardData(includeStats: boolean): Promise<DashboardData> {
  const catalogPromise = getPublicSearchCatalog();

  const [homepageSettings, catalog, homepageAdvertisements] = await Promise.all([
    getHomepageSettings(),
    catalogPromise,
    catalogPromise.then((catalog) =>
      getHomepageAdvertisements(categorySlugMap(catalog))
    ),
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
    categories: catalog.categories,
    cityNames: catalog.cityNames,
    neighborhoodsByCity: catalog.neighborhoodsByCity,
    homePremiumAdvertisements: homepageAdvertisements.premium,
    homeRegularAdvertisements: homepageAdvertisements.regular,
    homepageSettings,
  };
}

export async function getDashboardData(options?: {
  readonly includeStats?: boolean;
}): Promise<DashboardData> {
  const includeStats = options?.includeStats ?? false;

  try {
    return await loadDashboardData(includeStats);
  } catch (error) {
    console.error("[getDashboardData] falha ao carregar home:", error);
    return EMPTY_DASHBOARD;
  }
}
