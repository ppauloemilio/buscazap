import type { Advertisement as PrismaAdvertisement } from "@prisma/client";
import type { Advertisement } from "@/domain/entities";
import { AdvertisementStatus, AdvertisementType } from "@/domain/enums";
import { isPremiumActive } from "@/lib/provider-session";

export function mapAdvertisementToEntity(
  ad: PrismaAdvertisement
): Advertisement {
  const premiumActive = isPremiumActive(ad.premiumExpiresAt);

  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    type: ad.type as AdvertisementType,
    status: premiumActive
      ? AdvertisementStatus.PREMIUM
      : (ad.status as AdvertisementStatus),
    category: ad.category,
    location: {
      city: ad.city,
      state: ad.state,
      neighborhood: ad.neighborhood ?? undefined,
    },
    rating: ad.rating,
    reviewCount: ad.reviewCount,
    whatsappNumber: ad.whatsappNumber,
    isPremium: premiumActive,
    premiumExpiresAt: ad.premiumExpiresAt?.toISOString(),
    providerId: ad.providerId,
    createdAt: ad.createdAt.toISOString(),
  };
}
