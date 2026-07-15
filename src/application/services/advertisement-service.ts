import type { AdvertisementType, ServiceArea } from "@/domain/enums";
import type { SearchFilters } from "@/domain/entities";
import { AdvertisementStatus, ProviderStatus } from "@/domain/enums";
import { getCategoryBySlug } from "@/application/services/catalog-service";
import { ADVERTISEMENT_IMAGE_KIND } from "@/config/advertisement-images";
import { mapAdvertisementToEntity } from "@/infrastructure/mappers/advertisement-mapper";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";
import { markDataFetchDynamic } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { isPremiumActive } from "@/lib/provider-session";

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

async function matchesCategoryName(category: string, filter: string): Promise<boolean> {
  const bySlug = await getCategoryBySlug(filter);
  if (bySlug) {
    return category === bySlug.name;
  }
  return normalizeSearchText(category) === normalizeSearchText(filter);
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
      status: AdvertisementStatus.APPROVED,
      provider: { status: ProviderStatus.ACTIVE },
      ...(filters.type ? { type: filters.type } : {}),
    },
    include: {
      images: {
        where: { kind: ADVERTISEMENT_IMAGE_KIND.COVER },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let results = advertisements
    .map(mapAdvertisementToEntity)
    .filter((ad) => ad.status !== AdvertisementStatus.BLOCKED);

  if (filters.city?.trim()) {
    const cityQuery = normalizeSearchText(filters.city.trim());
    results = results.filter((ad) =>
      normalizeSearchText(ad.location.city).includes(cityQuery)
    );
  }

  if (filters.neighborhood?.trim()) {
    const neighborhoodQuery = normalizeSearchText(filters.neighborhood.trim());
    results = results.filter((ad) =>
      normalizeSearchText(ad.location.neighborhood ?? "").includes(
        neighborhoodQuery
      )
    );
  }

  if (filters.query) {
    const query = normalizeSearchText(filters.query);
    results = results.filter(
      (ad) =>
        normalizeSearchText(ad.title).includes(query) ||
        normalizeSearchText(ad.description).includes(query) ||
        normalizeSearchText(ad.category).includes(query)
    );
  }

  if (filters.category) {
    const categoryFilter = filters.category;
    const matching = await Promise.all(
      results.map(async (ad) => ({
        ad,
        match: await matchesCategoryName(ad.category, categoryFilter),
      }))
    );
    results = matching.filter((item) => item.match).map((item) => item.ad);
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
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
      provider: {
        select: {
          status: true,
          name: true,
          bio: true,
          businessHours: true,
          responseHint: true,
        },
      },
    },
  });

  if (!advertisement || advertisement.status === "BLOCKED") {
    return undefined;
  }

  if (advertisement.provider.status === ProviderStatus.BLOCKED) {
    return undefined;
  }

  return {
    ...mapAdvertisementToEntity(advertisement),
    providerName: advertisement.provider.name,
    providerBio: advertisement.provider.bio ?? undefined,
    providerBusinessHours: advertisement.provider.businessHours ?? undefined,
    providerResponseHint: advertisement.provider.responseHint ?? undefined,
  };
}

export async function findAdvertisementsByIds(ids: readonly string[]) {
  if (ids.length === 0) return [];

  markDataFetchDynamic();

  const advertisements = await prisma.advertisement.findMany({
    where: {
      id: { in: [...ids] },
      status: { not: AdvertisementStatus.BLOCKED },
      provider: { status: { not: ProviderStatus.BLOCKED } },
    },
    include: {
      images: {
        where: { kind: ADVERTISEMENT_IMAGE_KIND.COVER },
        take: 1,
      },
    },
  });

  const order = new Map(ids.map((id, index) => [id, index]));

  return advertisements
    .map(mapAdvertisementToEntity)
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function findProviderAdvertisements(providerId: string) {
  const advertisements = await prisma.advertisement.findMany({
    where: { providerId },
    include: {
      images: {
        where: { kind: "COVER" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return advertisements.map((ad) => ({
    ...mapAdvertisementToEntity(ad),
    premiumExpiresAt: ad.premiumExpiresAt,
    premiumActive: isPremiumActive(ad.premiumExpiresAt),
  }));
}

export async function findProviderAdvertisementForEdit(
  providerId: string,
  advertisementId: string
) {
  const advertisement = await prisma.advertisement.findFirst({
    where: { id: advertisementId, providerId },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!advertisement) {
    return null;
  }

  const cover = advertisement.images.find(
    (image) => image.kind === ADVERTISEMENT_IMAGE_KIND.COVER
  );
  const gallery = advertisement.images.filter(
    (image) => image.kind === ADVERTISEMENT_IMAGE_KIND.GALLERY
  );

  return {
    ...mapAdvertisementToEntity(advertisement),
    premiumActive: isPremiumActive(advertisement.premiumExpiresAt),
    coverImage: cover
      ? {
          id: cover.id,
          url: resolveAdvertisementImageUrl(cover.url),
        }
      : null,
    galleryImages: gallery.map((image) => ({
      id: image.id,
      url: resolveAdvertisementImageUrl(image.url),
    })),
  };
}

export async function createAdvertisement(input: {
  providerId: string;
  title: string;
  description: string;
  type: AdvertisementType;
  category: string;
  isCustomCategory?: boolean;
  city: string;
  state: string;
  neighborhood?: string;
  serviceArea?: ServiceArea;
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
      isCustomCategory: Boolean(input.isCustomCategory),
      city: input.city,
      state: input.state,
      neighborhood: input.neighborhood,
      serviceArea: input.serviceArea,
      whatsappNumber: input.whatsappNumber,
      status: "APPROVED",
    },
  });

  return {
    advertisement: mapAdvertisementToEntity(advertisement),
    requiresPremiumPayment: Boolean(input.withPremium),
  };
}

export async function deleteProviderAdvertisement(
  providerId: string,
  advertisementId: string
) {
  const advertisement = await prisma.advertisement.findFirst({
    where: {
      id: advertisementId,
      providerId,
    },
  });

  if (!advertisement) {
    throw new Error("Anúncio não encontrado");
  }

  await prisma.advertisement.delete({
    where: { id: advertisementId },
  });
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

/** Home feed: Premium → mais populares → mais recentes (sem duplicar). */
export async function getHomepageAdvertisements() {
  const advertisements = await findPublicAdvertisements({ query: "" });

  return [...advertisements].sort((a, b) => {
    if (a.isPremium !== b.isPremium) {
      return a.isPremium ? -1 : 1;
    }

    if (b.reviewCount !== a.reviewCount) {
      return b.reviewCount - a.reviewCount;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getCategoryNameBySlug(slug: string) {
  const { getCategoryNameBySlug: resolveCategoryName } = await import(
    "@/application/services/catalog-service"
  );
  return resolveCategoryName(slug);
}
