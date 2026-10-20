import { AdvertisementStatus, ProviderStatus, SubscriptionTier, UserRole } from "@/domain/enums";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";
import { markDataFetchDynamic } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { expireProviderPromotions } from "@/application/services/provider-promotion-service";
import { getPublicSearchCatalog, categorySlugMap } from "@/lib/public-search-catalog";

export const HOME_PROMOTIONS_LIMIT = 6;

export type PublicPromotionCard = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl?: string;
  readonly priceOriginal: number;
  readonly pricePromo: number;
  readonly endsAt: string;
  readonly discountPercent: number;
  readonly businessName: string;
  readonly href: string;
};

function calcDiscountPercent(original: number, promo: number): number {
  if (original <= 0 || promo >= original) return 0;
  return Math.max(1, Math.round((1 - promo / original) * 100));
}

function resolveAdCoverUrl(
  images: readonly { readonly url: string; readonly kind: string; readonly sortOrder: number }[]
): string | undefined {
  if (images.length === 0) return undefined;
  const cover = images.find((image) => image.kind === "COVER");
  const url = cover?.url ?? images[0]?.url;
  return url ? resolveAdvertisementImageUrl(url) : undefined;
}

export async function listPublicPromotionCards(options?: {
  readonly limit?: number;
}): Promise<readonly PublicPromotionCard[]> {
  markDataFetchDynamic();

  await expireProviderPromotions();

  const now = new Date();
  const limit = options?.limit;

  const [rows, catalog] = await Promise.all([
    prisma.providerPromotion.findMany({
      where: {
        isEnabled: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
        provider: {
          status: ProviderStatus.ACTIVE,
          OR: [
            { role: UserRole.ADMIN },
            {
              subscriptionExpiresAt: { gt: now },
              subscriptionTier: SubscriptionTier.PLUS,
              advertisements: {
                some: {
                  status: AdvertisementStatus.APPROVED,
                },
              },
            },
          ],
        },
      },
      include: {
        provider: {
          select: {
            advertisements: {
              where: { status: AdvertisementStatus.APPROVED },
              orderBy: [{ premiumExpiresAt: "desc" }, { updatedAt: "desc" }],
              take: 1,
              select: {
                id: true,
                title: true,
                slug: true,
                category: true,
                images: {
                  orderBy: { sortOrder: "asc" },
                  select: { url: true, kind: true, sortOrder: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      ...(limit ? { take: limit } : {}),
    }),
    getPublicSearchCatalog(),
  ]);

  const categorySlugs = categorySlugMap(catalog);

  const cards: PublicPromotionCard[] = [];

  for (const row of rows) {
    const ad = row.provider.advertisements[0];
    if (!ad) continue;

    const categorySlug =
      categorySlugs.get(ad.category) ?? (slugify(ad.category) || "geral");
    const baseHref = ad.slug
      ? `/${categorySlug}/${ad.slug}`
      : `/anuncio/${ad.id}`;
    const href = `${baseHref}?tab=promocoes&promo=${encodeURIComponent(row.id)}`;

    const promoImage = row.imageUrl
      ? resolveAdvertisementImageUrl(row.imageUrl)
      : undefined;
    const cover = resolveAdCoverUrl(ad.images);

    cards.push({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: promoImage || cover,
      priceOriginal: row.priceOriginal,
      pricePromo: row.pricePromo,
      endsAt: row.endsAt.toISOString(),
      discountPercent: calcDiscountPercent(row.priceOriginal, row.pricePromo),
      businessName: ad.title,
      href,
    });
  }

  return cards;
}

export async function listHomePromotionCards(): Promise<{
  readonly items: readonly PublicPromotionCard[];
  readonly total: number;
}> {
  // Busca 7 para saber se há mais que o limite da home sem contar tudo.
  const preview = await listPublicPromotionCards({
    limit: HOME_PROMOTIONS_LIMIT + 1,
  });
  const hasMore = preview.length > HOME_PROMOTIONS_LIMIT;
  const items = preview.slice(0, HOME_PROMOTIONS_LIMIT);

  return {
    items,
    total: hasMore ? HOME_PROMOTIONS_LIMIT + 1 : items.length,
  };
}
