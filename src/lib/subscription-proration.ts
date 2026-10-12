import { PRICING } from "@/config/pricing";
import { SubscriptionTier } from "@/domain/enums";
import { getProviderSubscriptionTier } from "@/lib/plus-plan";
import { hasActiveSubscription, type ProviderAccessProfile } from "@/lib/provider-session";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type ProviderProrationProfile = ProviderAccessProfile & {
  readonly subscriptionTier?: string | null;
};

/** Upgrade Básico → Pro com assinatura ainda vigente (pro-rata, mesma data de vencimento). */
export function isEligibleForProRataUpgrade(
  provider: ProviderProrationProfile,
  now = new Date()
): boolean {
  if (!hasActiveSubscription(provider.subscriptionExpiresAt)) {
    return false;
  }
  return getProviderSubscriptionTier(provider) === SubscriptionTier.BASIC;
}

export function countSubscriptionDaysRemaining(
  subscriptionExpiresAt: Date,
  now = new Date()
): number {
  const msLeft = subscriptionExpiresAt.getTime() - now.getTime();
  if (msLeft <= 0) {
    return 0;
  }
  return Math.ceil(msLeft / MS_PER_DAY);
}

export function calculateProRataUpgradeAmount(
  subscriptionExpiresAt: Date,
  now = new Date()
): number {
  const daysLeft = countSubscriptionDaysRemaining(subscriptionExpiresAt, now);
  if (daysLeft <= 0) {
    return PRICING.SUBSCRIPTION_PLUS_AMOUNT;
  }

  const monthlyDiff =
    PRICING.SUBSCRIPTION_PLUS_AMOUNT - PRICING.SUBSCRIPTION_AMOUNT;
  const billableDays = Math.min(daysLeft, PRICING.SUBSCRIPTION_DAYS);
  const raw = (monthlyDiff * billableDays) / PRICING.SUBSCRIPTION_DAYS;
  const rounded = Math.round(raw * 100) / 100;

  return Math.max(0.01, rounded);
}
