import { prisma } from "@/lib/prisma";
import { markDataFetchDynamic } from "@/lib/db";

export const HOMEPAGE_SECTION_IDS = [
  "popularCategories",
  "urgentSearches",
  "promotions",
  "advertisements",
  "cityExplorer",
] as const;

export type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number];

export type HomepageSettings = {
  readonly showUrgentSearches: boolean;
  readonly showPopularCategories: boolean;
  readonly showCityExplorer: boolean;
  readonly showPromotions: boolean;
  readonly plusPlanEnabled: boolean;
  readonly sectionOrder: readonly HomepageSectionId[];
};

export const DEFAULT_SECTION_ORDER: readonly HomepageSectionId[] = [
  "popularCategories",
  "urgentSearches",
  "promotions",
  "advertisements",
  "cityExplorer",
];

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  showUrgentSearches: false,
  showPopularCategories: false,
  showCityExplorer: false,
  showPromotions: false,
  plusPlanEnabled: false,
  sectionOrder: DEFAULT_SECTION_ORDER,
};

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionId, string> = {
  popularCategories: "Categorias populares",
  urgentSearches: "Precisa agora?",
  promotions: "Promoções",
  advertisements: "Anúncios (Premium, pagos e grátis)",
  cityExplorer: "Buscar por cidade",
};

function isHomepageSectionId(value: unknown): value is HomepageSectionId {
  return (
    typeof value === "string" &&
    (HOMEPAGE_SECTION_IDS as readonly string[]).includes(value)
  );
}

export function parseSectionOrder(raw: string | null | undefined): HomepageSectionId[] {
  if (!raw?.trim()) {
    return [...DEFAULT_SECTION_ORDER];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_SECTION_ORDER];
    }

    const valid = parsed.filter(isHomepageSectionId);
    const missing = DEFAULT_SECTION_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...DEFAULT_SECTION_ORDER];
  }
}

export function serializeSectionOrder(
  order: readonly HomepageSectionId[]
): string {
  const unique: HomepageSectionId[] = [];
  for (const id of order) {
    if (isHomepageSectionId(id) && !unique.includes(id)) {
      unique.push(id);
    }
  }
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!unique.includes(id)) {
      unique.push(id);
    }
  }
  return JSON.stringify(unique);
}

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
      showPromotions: settings.showPromotions,
      plusPlanEnabled: settings.plusPlanEnabled,
      sectionOrder: parseSectionOrder(settings.sectionOrderJson),
    };
  } catch {
    // Table/columns may not exist yet during first deploy window.
    return DEFAULT_HOMEPAGE_SETTINGS;
  }
}

export async function updateHomepageSettings(input: HomepageSettings) {
  const sectionOrderJson = serializeSectionOrder(input.sectionOrder);

  return prisma.homepageSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      showUrgentSearches: input.showUrgentSearches,
      showPopularCategories: input.showPopularCategories,
      showCityExplorer: input.showCityExplorer,
      showPromotions: input.showPromotions,
      plusPlanEnabled: input.plusPlanEnabled,
      sectionOrderJson,
    },
    update: {
      showUrgentSearches: input.showUrgentSearches,
      showPopularCategories: input.showPopularCategories,
      showCityExplorer: input.showCityExplorer,
      showPromotions: input.showPromotions,
      plusPlanEnabled: input.plusPlanEnabled,
      sectionOrderJson,
    },
  });
}
