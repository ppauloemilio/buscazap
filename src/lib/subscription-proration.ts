import { SubscriptionTier } from "@/domain/enums";
import { getProviderSubscriptionTier } from "@/lib/plus-plan";
import { hasActiveSubscription, type ProviderAccessProfile } from "@/lib/provider-session";

export {
  calculateProRataUpgradeAmount,
  countSubscriptionDaysRemaining,
} from "@/lib/subscription-proration-calc";

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
