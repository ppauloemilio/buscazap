import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { SubscriptionTier } from "@/domain/enums";
import {
  hasActiveSubscription,
  isAdminProvider,
  type ProviderAccessProfile,
} from "@/lib/provider-session";

export type ProviderTierProfile = ProviderAccessProfile & {
  readonly subscriptionTier?: string | null;
};

export function normalizeSubscriptionTier(
  value: string | null | undefined
): SubscriptionTier {
  if (value === SubscriptionTier.PLUS) {
    return SubscriptionTier.PLUS;
  }
  return SubscriptionTier.BASIC;
}

export function getProviderSubscriptionTier(
  provider: ProviderTierProfile
): SubscriptionTier {
  if (isAdminProvider(provider)) {
    return SubscriptionTier.PLUS;
  }
  return normalizeSubscriptionTier(provider.subscriptionTier);
}

export async function isPlusPlanOfferEnabled(): Promise<boolean> {
  const settings = await getHomepageSettings();
  return settings.plusPlanEnabled;
}

export async function canUsePlusFeatures(
  provider: ProviderTierProfile
): Promise<boolean> {
  if (isAdminProvider(provider)) {
    return true;
  }

  const offerEnabled = await isPlusPlanOfferEnabled();
  if (!offerEnabled) {
    return false;
  }

  if (!hasActiveSubscription(provider.subscriptionExpiresAt)) {
    return false;
  }

  return getProviderSubscriptionTier(provider) === SubscriptionTier.PLUS;
}
