import type {
  Advertisement as PrismaAdvertisement,
  AdvertisementImage as PrismaAdvertisementImage,
} from "@prisma/client";
import type { Advertisement } from "@/domain/entities";
import {
  AdvertisementStatus,
  AdvertisementType,
  ServiceArea,
} from "@/domain/enums";
import { ADVERTISEMENT_IMAGE_KIND } from "@/config/advertisement-images";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";
import { isPremiumActive } from "@/lib/provider-session";

type PrismaAdvertisementWithImages = PrismaAdvertisement & {
  readonly images?: readonly PrismaAdvertisementImage[];
};

function resolveCoverImageUrl(
  images: readonly PrismaAdvertisementImage[] | undefined
): string | undefined {
  if (!images?.length) {
    return undefined;
  }

  const cover = images.find((image) => image.kind === ADVERTISEMENT_IMAGE_KIND.COVER);
  return cover?.url ?? images[0]?.url;
}

function resolveGalleryImageUrls(
  images: readonly PrismaAdvertisementImage[] | undefined
): readonly string[] {
  if (!images?.length) {
    return [];
  }

  return images
    .filter((image) => image.kind === ADVERTISEMENT_IMAGE_KIND.GALLERY)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => image.url);
}

export function mapAdvertisementToEntity(
  ad: PrismaAdvertisementWithImages
): Advertisement {
  const premiumActive = isPremiumActive(ad.premiumExpiresAt);
  const coverImageUrl = resolveCoverImageUrl(ad.images);

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
    serviceArea: (ad.serviceArea as ServiceArea) || ServiceArea.CITY_WIDE,
    rating: ad.rating,
    reviewCount: ad.reviewCount,
    imageUrl: coverImageUrl ? resolveAdvertisementImageUrl(coverImageUrl) : undefined,
    galleryImages: resolveGalleryImageUrls(ad.images).map(resolveAdvertisementImageUrl),
    whatsappNumber: ad.whatsappNumber,
    whatsappLabel: ad.whatsappLabel ?? undefined,
    secondaryWhatsappNumber: ad.secondaryWhatsappNumber ?? undefined,
    secondaryWhatsappLabel: ad.secondaryWhatsappLabel ?? undefined,
    isPremium: premiumActive,
    premiumExpiresAt: ad.premiumExpiresAt?.toISOString(),
    providerId: ad.providerId,
    createdAt: ad.createdAt.toISOString(),
  };
}
