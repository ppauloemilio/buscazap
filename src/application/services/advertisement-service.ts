import type { AdvertisementType } from "@/domain/enums";
import type { SearchFilters } from "@/domain/entities";
import { AdvertisementStatus, ProviderStatus } from "@/domain/enums";
import { getCategoryBySlug } from "@/application/services/catalog-service";
import { ADVERTISEMENT_IMAGE_KIND } from "@/config/advertisement-images";
import { mapAdvertisementToEntity } from "@/infrastructure/mappers/advertisement-mapper";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";
import { markDataFetchDynamic } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { isPremiumActive } from "@/lib/provider-session";

async function matchesCategoryName(category: string, filter: string): Promise<boolean> {
  const bySlug = await getCategoryBySlug(filter);
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
      status: AdvertisementStatus.APPROVED,
      provider: { status: ProviderStatus.ACTIVE },
      ...(filters.city
        ? { city: { contains: filters.city } }
        : {}),
      ...(filters.type ? { type: filters.type } : {}),
    },
    include: {
      images: {
        where: { kind: "COVER" },
        take: 1,
      },
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
    },
  });

  if (!advertisement || advertisement.status === "BLOCKED") {
    return undefined;
  }

  const provider = await prisma.provider.findUnique({
    where: { id: advertisement.providerId },
    select: { status: true },
  });

  if (provider?.status === ProviderStatus.BLOCKED) {
    return undefined;
  }

  return mapAdvertisementToEntity(advertisement);
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

export async function getCategoryNameBySlug(slug: string) {
  const { getCategoryNameBySlug: resolveCategoryName } = await import(
    "@/application/services/catalog-service"
  );
  return resolveCategoryName(slug);
}
