import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { AdvertisementStatus, ProviderStatus, UserRole } from "@/domain/enums";
import {
  hasActiveSubscription,
  isAdminProvider,
} from "@/lib/provider-session";

/** Anúncios visíveis na busca/site. */
export function publicListingProviderWhere(now = new Date()) {
  // Freemium: qualquer conta ativa aparece (pago ou listagem básica).
  if (isNewAdProfileEnabled()) {
    return {
      status: ProviderStatus.ACTIVE,
    };
  }

  return {
    status: ProviderStatus.ACTIVE,
    OR: [{ role: UserRole.ADMIN }, { subscriptionExpiresAt: { gt: now } }],
  };
}

export function publicListingAdvertisementWhere(now = new Date()) {
  return {
    status: AdvertisementStatus.APPROVED,
    provider: publicListingProviderWhere(now),
  };
}

export function resolvePublicAdPlan(provider: {
  readonly role: string;
  readonly subscriptionExpiresAt: Date | null;
}): {
  readonly plan: "free" | "paid";
  readonly subscriptionActive: boolean;
} {
  const subscriptionActive =
    isAdminProvider(provider) ||
    hasActiveSubscription(provider.subscriptionExpiresAt);

  if (!isNewAdProfileEnabled()) {
    return { plan: "paid", subscriptionActive };
  }

  return {
    plan: subscriptionActive ? "paid" : "free",
    subscriptionActive,
  };
}
