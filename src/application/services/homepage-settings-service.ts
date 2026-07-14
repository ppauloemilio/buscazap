import { prisma } from "@/lib/prisma";
import { markDataFetchDynamic } from "@/lib/db";

export type HomepageSettings = {
  readonly showUrgentSearches: boolean;
  readonly showPopularCategories: boolean;
  readonly showCityExplorer: boolean;
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  showUrgentSearches: false,
  showPopularCategories: false,
  showCityExplorer: false,
};

export async function getHomepageSettings(): Promise<HomepageSettings> {
  markDataFetchDynamic();

  try {
    const settings = await prisma.homepageSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      return DEFAULT_HOMEPAGE_SETTINGS;
    }

    return {
      showUrgentSearches: settings.showUrgentSearches,
      showPopularCategories: settings.showPopularCategories,
      showCityExplorer: settings.showCityExplorer,
    };
  } catch {
    // Table may not exist yet during first deploy window.
    return DEFAULT_HOMEPAGE_SETTINGS;
  }
}

export async function updateHomepageSettings(input: HomepageSettings) {
  return prisma.homepageSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      showUrgentSearches: input.showUrgentSearches,
      showPopularCategories: input.showPopularCategories,
      showCityExplorer: input.showCityExplorer,
    },
    update: {
      showUrgentSearches: input.showUrgentSearches,
      showPopularCategories: input.showPopularCategories,
      showCityExplorer: input.showCityExplorer,
    },
  });
}
