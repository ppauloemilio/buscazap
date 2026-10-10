import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { AdvertisementType, ServiceArea } from "@/domain/enums";
import {
  canProviderUsePaidFeatures,
  isAdminProvider,
  type ProviderAccessProfile,
} from "@/lib/provider-session";

/** Listagem básica (freemium) sem assinatura paga. */
export function isFreeListingProvider(
  provider: ProviderAccessProfile
): boolean {
  if (!isNewAdProfileEnabled()) {
    return false;
  }
  if (isAdminProvider(provider)) {
    return false;
  }
  return !canProviderUsePaidFeatures(provider);
}

export const FREE_LISTING_DEFAULT_DESCRIPTION =
  "Contato pelo WhatsApp para mais informações.";

export const FREE_LISTING_DEFAULTS = {
  description: FREE_LISTING_DEFAULT_DESCRIPTION,
  type: AdvertisementType.SERVICE,
  serviceArea: ServiceArea.CITY_WIDE,
} as const;
