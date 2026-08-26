import type { AdvertisementType, ServiceArea } from "@/domain/enums";
import type { Advertisement, SearchFilters } from "@/domain/entities";
import { AdvertisementStatus } from "@/domain/enums";
import { getCategoryBySlug } from "@/application/services/catalog-service";
import { ADVERTISEMENT_IMAGE_KIND } from "@/config/advertisement-images";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import { mapAdvertisementToEntity } from "@/infrastructure/mappers/advertisement-mapper";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";
import { markDataFetchDynamic } from "@/lib/db";
import { getPublicSearchCatalog, categorySlugMap } from "@/lib/public-search-catalog";
import { prisma } from "@/lib/prisma";
import { publicListingAdvertisementWhere } from "@/lib/public-advertisement-visibility";
import { isPremiumActive } from "@/lib/provider-session";
import { slugify } from "@/lib/slug";
import {
  ensureUniqueAdvertisementSlug,
  resolveCategorySlugByName,
  resolveCategorySlugsByNames,
} from "@/application/services/slug-service";

const PUBLIC_SEARCH_MAX_RESULTS = 300;

export function getAdSlotLimitMessage(): string {
  return (
    `Sua assinatura inclui ${PRICING.ADS_INCLUDED_PER_SUBSCRIPTION} anúncio. ` +
    `Filial ou outro endereço = outro anúncio (+${formatPriceBRL(PRICING.EXTRA_AD_AMOUNT)}/mês). ` +
    `Fale conosco para liberar.`
  );
}

export async function countProviderAdvertisements(
  providerId: string
): Promise<number> {
  return prisma.advertisement.count({ where: { providerId } });
}

export async function providerHasAdSlotAvailable(
  providerId: string
): Promise<boolean> {
  const count = await countProviderAdvertisements(providerId);
  return count < PRICING.ADS_INCLUDED_PER_SUBSCRIPTION;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function toCategorySlugMap(
  slugByName?:
    | ReadonlyMap<string, string>
    | Readonly<Record<string, string>>
): Map<string, string> {
  if (!slugByName) {
    return new Map();
  }

  if (slugByName instanceof Map) {
    return new Map(slugByName);
  }

  return new Map(Object.entries(slugByName));
}

async function enrichWithPublicHref<
  T extends { id: string; title: string; category: string; slug?: string },
>(
  ads: readonly T[],
  options?: {
    readonly persistMissingSlug?: boolean;
    readonly knownCategorySlugs?:
      | ReadonlyMap<string, string>
      | Readonly<Record<string, string>>;
  }
): Promise<Array<T & { slug: string; publicHref: string }>> {
  if (ads.length === 0) {
    return [];
  }

  const persistMissingSlug = options?.persistMissingSlug ?? false;
  const categorySlugs = toCategorySlugMap(options?.knownCategorySlugs);

  const missingCategoryNames = [
    ...new Set(ads.map((ad) => ad.category)),
  ].filter((name) => !categorySlugs.has(name));

  if (missingCategoryNames.length > 0) {
    const resolved = await resolveCategorySlugsByNames(missingCategoryNames);
    for (const [name, slug] of resolved.entries()) {
      categorySlugs.set(name, slug);
    }
  }

  if (!persistMissingSlug) {
    return ads.map((ad) => {
      const slug = ad.slug?.trim() || "";
      const categorySlug =
        categorySlugs.get(ad.category) ?? slugify(ad.category);
      const publicHref = slug
        ? `/${categorySlug}/${slug}`
        : `/anuncio/${ad.id}`;

      return {
        ...ad,
        slug: slug || ad.id,
        publicHref,
      };
    });
  }

  return Promise.all(
    ads.map(async (ad) => {
      let slug = ad.slug?.trim() || "";

      if (!slug) {
        slug = await ensureUniqueAdvertisementSlug(ad.title, ad.id);
        await prisma.advertisement
          .update({ where: { id: ad.id }, data: { slug } })
          .catch(() => null);
      }

      const categorySlug =
        categorySlugs.get(ad.category) ?? slugify(ad.category);
      const publicHref = `/${categorySlug}/${slug}`;

      return {
        ...ad,
        slug,
        publicHref,
      };
    })
  );
}

export async function findPublicAdvertisements(
  filters: SearchFilters & {
    readonly premium?: boolean;
    readonly nonPremiumOnly?: boolean;
    readonly sort?: string;
    readonly take?: number;
    readonly knownCategorySlugs?:
      | ReadonlyMap<string, string>
      | Readonly<Record<string, string>>;
  } = { query: "" }
) {
  markDataFetchDynamic();

  const categoryFilter = filters.category?.trim();
  let categoryName: string | undefined;
  let categorySlugFallback: string | undefined;

  if (categoryFilter) {
    const catalogCategory = await getCategoryBySlug(categoryFilter);
    if (catalogCategory?.name) {
      categoryName = catalogCategory.name;
    } else {
      categorySlugFallback = categoryFilter;
    }
  }

  const cityFilter = filters.city?.trim();
  const neighborhoodFilter = filters.neighborhood?.trim();
  const queryFilter = filters.query?.trim();
  const now = new Date();
  const take =
    typeof filters.take === "number"
      ? filters.take
      : PUBLIC_SEARCH_MAX_RESULTS;

  const advertisements = await prisma.advertisement.findMany({
    where: {
      ...publicListingAdvertisementWhere(now),
      ...(filters.type ? { type: filters.type } : {}),
      ...(categoryName
        ? { category: { equals: categoryName, mode: "insensitive" } }
        : {}),
      ...(cityFilter
        ? { city: { contains: cityFilter, mode: "insensitive" } }
        : {}),
      ...(neighborhoodFilter
        ? {
            neighborhood: {
              contains: neighborhoodFilter,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.premium ? { premiumExpiresAt: { gt: now } } : {}),
      ...(filters.nonPremiumOnly
        ? {
            OR: [
              { premiumExpiresAt: null },
              { premiumExpiresAt: { lte: now } },
            ],
          }
        : {}),
      ...(queryFilter
        ? {
            OR: [
              { title: { contains: queryFilter, mode: "insensitive" } },
              { description: { contains: queryFilter, mode: "insensitive" } },
              { category: { contains: queryFilter, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      images: {
        where: { kind: ADVERTISEMENT_IMAGE_KIND.COVER },
        take: 1,
      },
    },
    orderBy:
      filters.sort === "recent"
        ? { createdAt: "desc" }
        : [{ reviewCount: "desc" }, { createdAt: "desc" }],
    take,
  });

  let results = await enrichWithPublicHref(
    advertisements
      .map(mapAdvertisementToEntity)
      .filter((ad) => ad.status !== AdvertisementStatus.BLOCKED),
    {
      persistMissingSlug: false,
      knownCategorySlugs:
        filters.knownCategorySlugs ??
        (categoryName && categoryFilter
          ? new Map([[categoryName, categoryFilter]])
          : undefined),
    }
  );

  if (categorySlugFallback) {
    const expected = normalizeSearchText(categorySlugFallback);
    results = results.filter(
      (ad) =>
        normalizeSearchText(ad.category) === expected ||
        normalizeSearchText(slugify(ad.category)) === expected
    );
  }

  // Refino com normalização de acentos (ex.: "acai" encontra "Açaí").
  if (queryFilter) {
    const query = normalizeSearchText(queryFilter);
    results = results.filter(
      (ad) =>
        normalizeSearchText(ad.title).includes(query) ||
        normalizeSearchText(ad.description).includes(query) ||
        normalizeSearchText(ad.category).includes(query)
    );
  }

  if (cityFilter) {
    const cityQuery = normalizeSearchText(cityFilter);
    results = results.filter((ad) =>
      normalizeSearchText(ad.location.city).includes(cityQuery)
    );
  }

  if (neighborhoodFilter) {
    const neighborhoodQuery = normalizeSearchText(neighborhoodFilter);
    results = results.filter((ad) =>
      normalizeSearchText(ad.location.neighborhood ?? "").includes(
        neighborhoodQuery
      )
    );
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

  const advertisement = await prisma.advertisement.findFirst({
    where: {
      id,
      ...publicListingAdvertisementWhere(),
    },
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

  if (!advertisement) {
    return undefined;
  }

  let slug = advertisement.slug;
  if (!slug) {
    slug = await ensureUniqueAdvertisementSlug(
      advertisement.title,
      advertisement.id
    );
    await prisma.advertisement
      .update({ where: { id: advertisement.id }, data: { slug } })
      .catch(() => null);
  }

  const categorySlug = await resolveCategorySlugByName(advertisement.category);

  return {
    ...mapAdvertisementToEntity(advertisement),
    slug,
    publicHref: `/${categorySlug}/${slug}`,
    providerName: advertisement.provider.name,
    providerBio: advertisement.provider.bio ?? undefined,
    providerBusinessHours: advertisement.provider.businessHours ?? undefined,
    providerResponseHint: advertisement.provider.responseHint ?? undefined,
  };
}

export async function findAdvertisementByCategoryAndSlug(
  categorySlug: string,
  adSlug: string
) {
  markDataFetchDynamic();

  const category = await prisma.catalogCategory.findFirst({
    where: { slug: categorySlug, isActive: true },
    select: { name: true, slug: true },
  });

  if (!category) {
    return undefined;
  }

  const advertisement = await prisma.advertisement.findFirst({
    where: {
      slug: adSlug,
      category: category.name,
      ...publicListingAdvertisementWhere(),
    },
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

  if (!advertisement) {
    return undefined;
  }

  return {
    ...mapAdvertisementToEntity(advertisement),
    slug: advertisement.slug ?? adSlug,
    publicHref: `/${category.slug}/${adSlug}`,
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
      ...publicListingAdvertisementWhere(),
    },
    include: {
      images: {
        where: { kind: ADVERTISEMENT_IMAGE_KIND.COVER },
        take: 1,
      },
    },
  });

  const order = new Map(ids.map((id, index) => [id, index]));

  const mapped = await enrichWithPublicHref(
    advertisements.map(mapAdvertisementToEntity)
  );

  return mapped.sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );
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

  const mapped = await enrichWithPublicHref(
    advertisements.map(mapAdvertisementToEntity),
    { persistMissingSlug: false }
  );

  const premiumById = new Map(
    advertisements.map((ad) => [ad.id, ad.premiumExpiresAt] as const)
  );

  return mapped.map((ad) => {
    const premiumExpiresAt = premiumById.get(ad.id) ?? null;
    return {
      ...ad,
      premiumExpiresAt,
      premiumActive: isPremiumActive(premiumExpiresAt),
    };
  });
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
  whatsappLabel?: string;
  secondaryWhatsappNumber?: string;
  secondaryWhatsappLabel?: string;
  withPremium?: boolean;
  /** Admin / publicação de lead: permite anúncio além do slot incluso. */
  bypassAdSlotLimit?: boolean;
}) {
  if (!input.bypassAdSlotLimit) {
    const hasSlot = await providerHasAdSlotAvailable(input.providerId);
    if (!hasSlot) {
      throw new Error(getAdSlotLimitMessage());
    }
  }

  const slug = await ensureUniqueAdvertisementSlug(input.title);

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
      neighborhood: input.neighborhood || null,
      serviceArea: input.serviceArea,
      whatsappNumber: input.whatsappNumber,
      whatsappLabel: input.whatsappLabel || null,
      secondaryWhatsappNumber: input.secondaryWhatsappNumber || null,
      secondaryWhatsappLabel: input.secondaryWhatsappLabel || null,
      slug,
      status: "APPROVED",
    },
  });

  const { syncReferralCreditsForProvider } = await import(
    "@/application/services/referral-service"
  );
  await syncReferralCreditsForProvider(input.providerId);

  const entity = mapAdvertisementToEntity(advertisement);
  const categorySlug = await resolveCategorySlugByName(input.category);

  return {
    advertisement: {
      ...entity,
      publicHref: `/${categorySlug}/${slug}`,
    },
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

  const { syncReferralCreditsForProvider } = await import(
    "@/application/services/referral-service"
  );
  await syncReferralCreditsForProvider(providerId);
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

const HOMEPAGE_AD_LIMIT = 24;

function sortHomepageAdvertisements<
  T extends { reviewCount: number; createdAt: string },
>(ads: readonly T[]): T[] {
  return [...ads].sort((a, b) => {
    if (b.reviewCount !== a.reviewCount) {
      return b.reviewCount - a.reviewCount;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export interface HomepageAdvertisements {
  readonly premium: readonly Advertisement[];
  readonly regular: readonly Advertisement[];
}

/** Home: premium ativos em seção própria; regulares até completar o limite da grade. */
export async function getHomepageAdvertisements(
  knownCategorySlugs?: ReadonlyMap<string, string>
): Promise<HomepageAdvertisements> {
  const categorySlugs =
    knownCategorySlugs ??
    categorySlugMap(await getPublicSearchCatalog());

  const [premiumAds, regularAds] = await Promise.all([
    findPublicAdvertisements({
      query: "",
      premium: true,
      sort: "popular",
      knownCategorySlugs: categorySlugs,
    }),
    findPublicAdvertisements({
      query: "",
      nonPremiumOnly: true,
      sort: "popular",
      take: HOMEPAGE_AD_LIMIT,
      knownCategorySlugs: categorySlugs,
    }),
  ]);

  const premium = sortHomepageAdvertisements(premiumAds);
  const regularLimit = Math.max(0, HOMEPAGE_AD_LIMIT - premium.length);
  const regular = sortHomepageAdvertisements(regularAds).slice(0, regularLimit);

  return { premium, regular };
}

export async function getCategoryNameBySlug(slug: string) {
  const { getCategoryNameBySlug: resolveCategoryName } = await import(
    "@/application/services/catalog-service"
  );
  return resolveCategoryName(slug);
}
