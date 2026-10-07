import { isNewAdProfileEnabled } from "@/config/feature-flags";
import {
  hasActiveSubscription,
  isAdminProvider,
  type ProviderAccessProfile,
} from "@/lib/provider-session";

export type PublicAdPlan = "free" | "paid";

export function getProviderPlan(provider: ProviderAccessProfile): PublicAdPlan {
  if (!isNewAdProfileEnabled()) {
    return hasActiveSubscription(provider.subscriptionExpiresAt) ||
      isAdminProvider(provider)
      ? "paid"
      : "free";
  }

  if (isAdminProvider(provider) || hasActiveSubscription(provider.subscriptionExpiresAt)) {
    return "paid";
  }

  return "free";
}

export function canUsePaidAdFeatures(provider: ProviderAccessProfile): boolean {
  if (!isNewAdProfileEnabled()) {
    return (
      isAdminProvider(provider) ||
      hasActiveSubscription(provider.subscriptionExpiresAt)
    );
  }

  return getProviderPlan(provider) === "paid";
}

/** Com freemium ligado, qualquer anunciante ativo pode manter listagem básica. */
export function canMaintainFreeListing(provider: {
  readonly role: string;
  readonly status?: string | null;
  readonly subscriptionExpiresAt: Date | null;
}): boolean {
  if (!isNewAdProfileEnabled()) {
    return (
      isAdminProvider(provider) ||
      hasActiveSubscription(provider.subscriptionExpiresAt)
    );
  }

  return provider.status !== "BLOCKED";
}
