import type { AdvertisementType } from "@/domain/enums";
import type { SearchFilters } from "@/domain/entities";
import { AdvertisementStatus } from "@/domain/enums";
import { mapAdvertisementToEntity } from "@/infrastructure/mappers/advertisement-mapper";
import { CATEGORIES } from "@/infrastructure/data/mock-dashboard";
import { markDataFetchDynamic } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { isPremiumActive } from "@/lib/provider-session";

function matchesCategoryName(category: string, filter: string): boolean {
  const bySlug = CATEGORIES.find((item) => item.slug === filter);
  if (bySlug) {
    return category === bySlug.name;
  }
  return category.toLowerCase() === filter.toLowerCase();
}

export async function findPublicAdvertisements(
  filters: SearchFilters & {
    readonly premium?: boolean;
    readonly sort?: string;
  } = { query: "" }
) {
  markDataFetchDynamic();

  const advertisements = await prisma.advertisement.findMany({
    where: {
      status: { in: ["APPROVED", "PREMIUM"] },
      ...(filters.city
        ? { city: { contains: filters.city } }
        : {}),
      ...(filters.type ? { type: filters.type } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  let results = advertisements
    .map(mapAdvertisementToEntity)
    .filter((ad) => ad.status !== AdvertisementStatus.BLOCKED);

  if (filters.query) {
    const query = filters.query.toLowerCase();
    results = results.filter(
      (ad) =>
        ad.title.toLowerCase().includes(query) ||
        ad.description.toLowerCase().includes(query) ||
        ad.category.toLowerCase().includes(query)
    );
  }

  if (filters.category) {
    results = results.filter((ad) =>
      matchesCategoryName(ad.category, filters.category!)
    );
  }

  if (filters.premium) {
    results = results.filter((ad) => ad.isPremium);
  }

  if (filters.sort === "recent") {
    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (filters.sort === "popular") {
    results.sort((a, b) => b.reviewCount - a.reviewCount);
  } else {
    results.sort((a, b) => {
      if (a.isPremium !== b.isPremium) {
        return a.isPremium ? -1 : 1;
      }
      return b.reviewCount - a.reviewCount;
    });
  }

  return results;
}

export async function findAdvertisementById(id: string) {
  markDataFetchDynamic();

  const advertisement = await prisma.advertisement.findUnique({
    where: { id },
  });

  if (!advertisement || advertisement.status === "BLOCKED") {
    return undefined;
  }

  return mapAdvertisementToEntity(advertisement);
}

export async function findProviderAdvertisements(providerId: string) {
  const advertisements = await prisma.advertisement.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
  });

  return advertisements.map((ad) => ({
    ...mapAdvertisementToEntity(ad),
    premiumExpiresAt: ad.premiumExpiresAt,
    premiumActive: isPremiumActive(ad.premiumExpiresAt),
  }));
}

export async function createAdvertisement(input: {
  providerId: string;
  title: string;
  description: string;
  type: AdvertisementType;
  category: string;
  city: string;
  state: string;
  neighborhood?: string;
  whatsappNumber: string;
  withPremium?: boolean;
}) {
  const advertisement = await prisma.advertisement.create({
    data: {
      providerId: input.providerId,
      title: input.title,
      description: input.description,
      type: input.type,
      category: input.category,
      city: input.city,
      state: input.state,
      neighborhood: input.neighborhood,
      whatsappNumber: input.whatsappNumber,
      status: "APPROVED",
    },
  });

  return {
    advertisement: mapAdvertisementToEntity(advertisement),
    requiresPremiumPayment: Boolean(input.withPremium),
  };
}

export async function getPremiumAdvertisements() {
  const advertisements = await findPublicAdvertisements({ query: "" });
  return advertisements.filter((ad) => ad.isPremium).slice(0, 6);
}

export async function getRecentAdvertisements() {
  return findPublicAdvertisements({ query: "", sort: "recent" }).then((ads) =>
    ads.slice(0, 3)
  );
}

export async function getPopularAdvertisements() {
  return findPublicAdvertisements({ query: "", sort: "popular" }).then((ads) =>
    ads.slice(0, 3)
  );
}

export function getCategoryNameBySlug(slug: string): string | undefined {
  return CATEGORIES.find((category) => category.slug === slug)?.name;
}
