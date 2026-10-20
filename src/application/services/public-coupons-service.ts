import {
  AdvertisementStatus,
  ProviderStatus,
  SubscriptionTier,
  UserRole,
} from "@/domain/enums";
import { markDataFetchDynamic } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { expireProviderCoupons } from "@/application/services/provider-coupon-service";

export const HOME_COUPONS_LIMIT = 6;

export type PublicCouponCard = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly quantityRemaining: number;
  readonly endsAt: string;
  readonly businessName: string;
};

export async function listPublicCouponCards(options?: {
  readonly limit?: number;
}): Promise<readonly PublicCouponCard[]> {
  markDataFetchDynamic();
  await expireProviderCoupons();

  const now = new Date();
  const rows = await prisma.providerCoupon.findMany({
    where: {
      isEnabled: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      quantityRemaining: { gt: 0 },
      provider: {
        status: ProviderStatus.ACTIVE,
        OR: [
          // Conta admin (demo / operação) — não exige anúncio aprovado
          { role: UserRole.ADMIN },
          {
            subscriptionExpiresAt: { gt: now },
            subscriptionTier: SubscriptionTier.PLUS,
            advertisements: {
              some: { status: AdvertisementStatus.APPROVED },
            },
          },
        ],
      },
    },
    include: {
      provider: {
        select: {
          name: true,
          advertisements: {
            where: { status: AdvertisementStatus.APPROVED },
            orderBy: [{ premiumExpiresAt: "desc" }, { updatedAt: "desc" }],
            take: 1,
            select: { title: true },
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    ...(options?.limit ? { take: options.limit } : {}),
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    badgeLabel: row.badgeLabel,
    quantityRemaining: row.quantityRemaining,
    endsAt: row.endsAt.toISOString(),
    businessName: row.provider.advertisements[0]?.title ?? row.provider.name,
  }));
}

export async function listHomeCouponCards(): Promise<{
  readonly items: readonly PublicCouponCard[];
  readonly total: number;
}> {
  const preview = await listPublicCouponCards({
    limit: HOME_COUPONS_LIMIT + 1,
  });
  const hasMore = preview.length > HOME_COUPONS_LIMIT;
  const items = preview.slice(0, HOME_COUPONS_LIMIT);

  return {
    items,
    total: hasMore ? HOME_COUPONS_LIMIT + 1 : items.length,
  };
}
