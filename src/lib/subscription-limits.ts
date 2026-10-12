import { SubscriptionTier } from "@/domain/enums";
import { PRICING } from "@/config/pricing";
import {
  getProviderSubscriptionTier,
  type ProviderTierProfile,
} from "@/lib/plus-plan";
import { hasActiveSubscription, isAdminProvider } from "@/lib/provider-session";

export function getMaxCompanyPhotosForTier(tier: SubscriptionTier): number {
  return tier === SubscriptionTier.PLUS
    ? PRICING.PRO_MAX_COMPANY_PHOTOS
    : PRICING.PROVIDER_MAX_COMPANY_PHOTOS;
}

export function getMaxProductsForTier(tier: SubscriptionTier): number {
  return tier === SubscriptionTier.PLUS
    ? PRICING.PRO_MAX_PRODUCTS
    : PRICING.PAID_MAX_PRODUCTS;
}

export function getMaxServicesForTier(tier: SubscriptionTier): number {
  return tier === SubscriptionTier.PLUS
    ? PRICING.PRO_MAX_SERVICES
    : PRICING.PAID_MAX_SERVICES;
}

export function getMaxPublicGalleryForTier(
  tier: SubscriptionTier,
  premiumActive: boolean
): number {
  const company = getMaxCompanyPhotosForTier(tier);
  if (!premiumActive) {
    return company;
  }
  return company + PRICING.PREMIUM_AD_GALLERY;
}

export function resolveProviderSubscriptionTier(
  provider: ProviderTierProfile
): SubscriptionTier {
  return getProviderSubscriptionTier(provider);
}

export function getLimitsForProvider(provider: ProviderTierProfile) {
  const tier = resolveProviderSubscriptionTier(provider);
  return {
    tier,
    maxCompanyPhotos: getMaxCompanyPhotosForTier(tier),
    maxProducts: getMaxProductsForTier(tier),
    maxServices: getMaxServicesForTier(tier),
  };
}

export type PublicPlanTierLabel = "Grátis" | "Básico" | "Pro";

export function resolvePublicPlanTierLabel(input: {
  readonly role?: string;
  readonly subscriptionExpiresAt?: Date | null;
  readonly subscriptionTier?: string | null;
  readonly publicPlan?: "free" | "paid";
}): PublicPlanTierLabel | undefined {
  if (input.publicPlan === "free") {
    return "Grátis";
  }
  if (input.publicPlan !== "paid") {
    return undefined;
  }
  const active =
    isAdminProvider({ role: input.role ?? "PROVIDER", subscriptionExpiresAt: input.subscriptionExpiresAt ?? null }) ||
    hasActiveSubscription(input.subscriptionExpiresAt ?? null);
  if (!active) {
    return "Grátis";
  }
  const tier = getProviderSubscriptionTier({
    role: input.role ?? "PROVIDER",
    subscriptionExpiresAt: input.subscriptionExpiresAt ?? null,
    subscriptionTier: input.subscriptionTier,
  });
  return tier === SubscriptionTier.PLUS ? "Pro" : "Básico";
}
