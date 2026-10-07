import type {
  Advertisement as PrismaAdvertisement,
  AdvertisementImage as PrismaAdvertisementImage,
  AdvertisementProduct as PrismaAdvertisementProduct,
  AdvertisementService as PrismaAdvertisementService,
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
  readonly products?: readonly PrismaAdvertisementProduct[];
  readonly services?: readonly PrismaAdvertisementService[];
  readonly provider?: {
    readonly subscriptionExpiresAt?: Date | null;
    readonly role?: string;
  };
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

function resolveLogoImageUrl(
  images: readonly PrismaAdvertisementImage[] | undefined
): string | undefined {
  if (!images?.length) {
    return undefined;
  }

  return images.find((image) => image.kind === ADVERTISEMENT_IMAGE_KIND.LOGO)
    ?.url;
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
  ad: PrismaAdvertisementWithImages,
  options?: {
    readonly plan?: "free" | "paid";
    readonly subscriptionActive?: boolean;
  }
): Advertisement {
  const premiumActive = isPremiumActive(ad.premiumExpiresAt);
  const coverImageUrl = resolveCoverImageUrl(ad.images);
  const logoImageUrl = resolveLogoImageUrl(ad.images);
  const plan = options?.plan;
  const showPaidExtras = plan !== "free";

  return {
    id: ad.id,
    title: ad.title,
    description: showPaidExtras ? ad.description : "",
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
    streetAddress: showPaidExtras
      ? (ad.streetAddress ?? undefined)
      : undefined,
    instagram: showPaidExtras ? (ad.instagram ?? undefined) : undefined,
    website: showPaidExtras ? (ad.website ?? undefined) : undefined,
    businessHoursJson: showPaidExtras
      ? (ad.businessHoursJson ?? undefined)
      : undefined,
    rating: ad.rating,
    reviewCount: ad.reviewCount,
    imageUrl:
      showPaidExtras && coverImageUrl
        ? resolveAdvertisementImageUrl(coverImageUrl)
        : undefined,
    logoUrl:
      showPaidExtras && logoImageUrl
        ? resolveAdvertisementImageUrl(logoImageUrl)
        : undefined,
    galleryImages: showPaidExtras
      ? resolveGalleryImageUrls(ad.images).map(resolveAdvertisementImageUrl)
      : [],
    whatsappNumber: ad.whatsappNumber,
    whatsappLabel: ad.whatsappLabel ?? undefined,
    secondaryWhatsappNumber: showPaidExtras
      ? (ad.secondaryWhatsappNumber ?? undefined)
      : undefined,
    secondaryWhatsappLabel: showPaidExtras
      ? (ad.secondaryWhatsappLabel ?? undefined)
      : undefined,
    slug: ad.slug ?? undefined,
    isPremium: showPaidExtras && premiumActive,
    premiumExpiresAt: ad.premiumExpiresAt?.toISOString(),
    plan,
    subscriptionActive: options?.subscriptionActive,
    products: showPaidExtras
      ? (ad.products ?? [])
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((product) => ({
            id: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl
              ? resolveAdvertisementImageUrl(product.imageUrl)
              : undefined,
          }))
      : [],
    services: showPaidExtras
      ? (ad.services ?? [])
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((service) => ({
            id: service.id,
            title: service.title,
            description: service.description,
            priceFrom: service.priceFrom ?? undefined,
            imageUrl: service.imageUrl
              ? resolveAdvertisementImageUrl(service.imageUrl)
              : undefined,
          }))
      : [],
    providerId: ad.providerId,
    createdAt: ad.createdAt.toISOString(),
  };
}
