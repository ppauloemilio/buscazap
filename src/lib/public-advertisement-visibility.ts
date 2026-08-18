import { AdvertisementStatus, ProviderStatus, UserRole } from "@/domain/enums";

/** Anúncios visíveis na busca/site: aprovados, conta ativa e assinatura vigente. */
export function publicListingProviderWhere(now = new Date()) {
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
