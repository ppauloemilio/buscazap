import type { DashboardStats, Category } from "@/domain/entities";
import {
  getPopularAdvertisements,
  getPremiumAdvertisements,
  getRecentAdvertisements,
} from "@/application/services/advertisement-service";
import {
  CATEGORIES,
  DASHBOARD_STATS,
} from "@/infrastructure/data/mock-dashboard";

export interface DashboardData {
  readonly stats: DashboardStats;
  readonly categories: readonly Category[];
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
  const [premiumAdvertisements, recentAdvertisements, popularAdvertisements] =
    await Promise.all([
      getPremiumAdvertisements(),
      getRecentAdvertisements(),
      getPopularAdvertisements(),
    ]);

  return {
    stats: DASHBOARD_STATS,
    categories: CATEGORIES,
    premiumAdvertisements,
    recentAdvertisements,
    popularAdvertisements,
  };
}
