import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { AdvertisementType, ListingProfile, ServiceArea } from "@/domain/enums";
import {
  canProviderUsePaidFeatures,
  isAdminProvider,
  type ProviderAccessProfile,
} from "@/lib/provider-session";

export type ProviderListingAccess = ProviderAccessProfile & {
  readonly listingProfile?: string | null;
};

/** Painel e formulários enxutos (usuário novo listagem grátis). */
export function shouldUseSimpleFreeListingUx(
  provider: ProviderListingAccess
): boolean {
  if (!isNewAdProfileEnabled()) {
    return false;
  }
  if (isAdminProvider(provider)) {
    return false;
  }
  return !hasFullListingProfile(provider);
}

/** @deprecated Use shouldUseSimpleFreeListingUx */
export function isFreeListingProvider(provider: ProviderListingAccess): boolean {
  return shouldUseSimpleFreeListingUx(provider);
}

/** Pode usar painel completo (criou/assinou perfil pago; mantém após vencimento). */
export function hasFullListingProfile(provider: ProviderListingAccess): boolean {
  if (!isNewAdProfileEnabled()) {
    return true;
  }
  if (isAdminProvider(provider)) {
    return true;
  }
  return (provider.listingProfile ?? ListingProfile.SIMPLE) === ListingProfile.FULL;
}

/** Vitrine paga ativa (assinatura vigente). */
export function hasActivePaidPublicListing(provider: ProviderAccessProfile): boolean {
  return canProviderUsePaidFeatures(provider);
}

export const FREE_LISTING_DEFAULT_DESCRIPTION =
  "Contato pelo WhatsApp para mais informações.";

export const FREE_LISTING_DEFAULTS = {
  description: FREE_LISTING_DEFAULT_DESCRIPTION,
  type: AdvertisementType.SERVICE,
  serviceArea: ServiceArea.CITY_WIDE,
} as const;
