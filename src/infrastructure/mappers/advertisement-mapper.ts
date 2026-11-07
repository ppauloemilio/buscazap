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
import { PRICING } from "@/config/pricing";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";
import {
  getMaxCompanyPhotosForTier,
  getMaxPublicGalleryForTier,
  resolveProviderSubscriptionTier,
  resolvePublicPlanTierLabel,
} from "@/lib/subscription-limits";
import { isPremiumActive } from "@/lib/provider-session";

type PrismaAdvertisementWithImages = PrismaAdvertisement & {
  readonly images?: readonly PrismaAdvertisementImage[];
  readonly products?: readonly PrismaAdvertisementProduct[];
  readonly services?: readonly PrismaAdvertisementService[];
  readonly provider?: {
    readonly subscriptionExpiresAt?: Date | null;
    readonly subscriptionTier?: string | null;
    readonly role?: string;
    readonly companyImages?: readonly { readonly url: string; readonly sortOrder: number }[];
  };
};

function resolveKindUrl(
  images: readonly PrismaAdvertisementImage[] | undefined,
  kind: string
): string | undefined {
  if (!images?.length) {
    return undefined;
  }

  return images.find((image) => image.kind === kind)?.url;
}

/** URL bruta do card (listagem), com fallback para o banner. */
function resolveCardImageUrl(
  images: readonly PrismaAdvertisementImage[] | undefined
): string | undefined {
  return (
    resolveKindUrl(images, ADVERTISEMENT_IMAGE_KIND.CARD) ??
    resolveKindUrl(images, ADVERTISEMENT_IMAGE_KIND.COVER) ??
    images?.find(
      (image) =>
        image.kind !== ADVERTISEMENT_IMAGE_KIND.LOGO &&
        image.kind !== ADVERTISEMENT_IMAGE_KIND.GALLERY
    )?.url ??
    images?.[0]?.url
  );
}

/** URL bruta do banner (topo do anúncio), com fallback para o card. */
function resolveBannerImageUrl(
  images: readonly PrismaAdvertisementImage[] | undefined
): string | undefined {
  return (
    resolveKindUrl(images, ADVERTISEMENT_IMAGE_KIND.COVER) ??
    resolveKindUrl(images, ADVERTISEMENT_IMAGE_KIND.CARD) ??
    resolveCardImageUrl(images)
  );
}

function resolveLogoImageUrl(
  images: readonly PrismaAdvertisementImage[] | undefined
): string | undefined {
  return resolveKindUrl(images, ADVERTISEMENT_IMAGE_KIND.LOGO);
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
    readonly hasActivePromotions?: boolean;
    readonly promotions?: readonly {
      readonly id: string;
      readonly title: string;
      readonly description: string;
      readonly imageUrl: string | null;
      readonly priceOriginal: number;
      readonly pricePromo: number;
      readonly startsAt: Date;
      readonly endsAt: Date;
    }[];
  }
): Advertisement {
  const premiumActive = isPremiumActive(ad.premiumExpiresAt);
  const cardImageUrl = resolveCardImageUrl(ad.images);
  const bannerImageUrl = resolveBannerImageUrl(ad.images);
  const logoImageUrl = resolveLogoImageUrl(ad.images);
  const plan = options?.plan;
  const showPaidExtras = plan !== "free";
  const adGalleryUrls = resolveGalleryImageUrls(ad.images).map(
    resolveAdvertisementImageUrl
  );
  const subscriptionTier = ad.provider
    ? resolveProviderSubscriptionTier({
        role: ad.provider.role ?? "PROVIDER",
        subscriptionExpiresAt: ad.provider.subscriptionExpiresAt ?? null,
        subscriptionTier: ad.provider.subscriptionTier,
      })
    : null;
  const maxCompanyPhotos = subscriptionTier
    ? getMaxCompanyPhotosForTier(subscriptionTier)
    : PRICING.PROVIDER_MAX_COMPANY_PHOTOS;

  const companyUrls = (ad.provider?.companyImages ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => resolveAdvertisementImageUrl(image.url))
    .slice(0, maxCompanyPhotos);

  let galleryImages: readonly string[] = [];
  if (showPaidExtras) {
    if (isNewAdProfileEnabled()) {
      const premiumExtras = premiumActive
        ? adGalleryUrls.slice(0, PRICING.PREMIUM_AD_GALLERY)
        : [];
      const galleryCap = subscriptionTier
        ? getMaxPublicGalleryForTier(subscriptionTier, premiumActive)
        : premiumActive
          ? PRICING.PREMIUM_MAX_GALLERY
          : PRICING.PROVIDER_MAX_COMPANY_PHOTOS;
      galleryImages = [...companyUrls, ...premiumExtras].slice(0, galleryCap);
    } else {
      galleryImages = adGalleryUrls;
    }
  }

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
      showPaidExtras && cardImageUrl
        ? resolveAdvertisementImageUrl(cardImageUrl)
        : undefined,
    bannerUrl:
      showPaidExtras && bannerImageUrl
        ? resolveAdvertisementImageUrl(bannerImageUrl)
        : undefined,
    logoUrl:
      showPaidExtras && logoImageUrl
        ? resolveAdvertisementImageUrl(logoImageUrl)
        : undefined,
    galleryImages,
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
    planTierLabel: resolvePublicPlanTierLabel({
      role: ad.provider?.role,
      subscriptionExpiresAt: ad.provider?.subscriptionExpiresAt ?? null,
      subscriptionTier: ad.provider?.subscriptionTier,
      publicPlan: plan,
    }),
    subscriptionActive: options?.subscriptionActive,
    hasActivePromotions: options?.hasActivePromotions,
    promotions:
      showPaidExtras && options?.promotions?.length
        ? options.promotions.map((promo) => ({
            id: promo.id,
            title: promo.title,
            description: promo.description,
            imageUrl: promo.imageUrl
              ? resolveAdvertisementImageUrl(promo.imageUrl)
              : undefined,
            priceOriginal: promo.priceOriginal,
            pricePromo: promo.pricePromo,
            startsAt: promo.startsAt.toISOString(),
            endsAt: promo.endsAt.toISOString(),
          }))
        : undefined,
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
