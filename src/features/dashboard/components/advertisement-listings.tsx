import type { Advertisement } from "@/domain/entities";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import {
  splitAdvertisementsByPlan,
  splitAdvertisementsByPremium,
} from "@/shared/utils/advertisement-listings";
import { AdvertisementSection } from "./advertisement-section";

interface AdvertisementListingsProps {
  readonly advertisements: readonly Advertisement[];
  readonly regularTitle?: string;
  readonly regularDescription?: string;
  readonly viewAllHref?: string;
  readonly premiumViewAllHref?: string;
  readonly returnTo?: string;
  readonly premiumOnly?: boolean;
}

export function AdvertisementListings({
  advertisements,
  regularTitle = "Anúncios",
  regularDescription,
  viewAllHref,
  premiumViewAllHref = "/buscar?premium=true",
  returnTo,
  premiumOnly = false,
}: AdvertisementListingsProps) {
  const { premium, regular } = splitAdvertisementsByPremium(advertisements);
  const freemium = isNewAdProfileEnabled();
  const { paid, free } = freemium
    ? splitAdvertisementsByPlan(regular)
    : { paid: regular, free: [] as Advertisement[] };

  if (premiumOnly) {
    if (premium.length === 0) {
      return null;
    }

    return (
      <AdvertisementSection
        variant="premium"
        title="Destaques Premium"
        description="Anunciantes em destaque — contato direto pelo WhatsApp"
        advertisements={premium}
        viewAllHref={premiumViewAllHref}
        returnTo={returnTo}
        emphasizePremium
      />
    );
  }

  return (
    <>
      {premium.length > 0 && (
        <AdvertisementSection
          variant="premium"
          title="Destaques Premium"
          description="Anunciantes em destaque — contato direto pelo WhatsApp"
          advertisements={premium}
          viewAllHref={premiumViewAllHref}
          returnTo={returnTo}
          emphasizePremium
        />
      )}
      {paid.length > 0 && (
        <AdvertisementSection
          title={regularTitle}
          description={regularDescription}
          advertisements={paid}
          viewAllHref={viewAllHref}
          returnTo={returnTo}
        />
      )}
      {free.length > 0 && (
        <AdvertisementSection
          variant="free"
          compact
          title="Listagens grátis"
          advertisements={free}
          viewAllHref={viewAllHref}
          returnTo={returnTo}
        />
      )}
    </>
  );
}
