import type { Advertisement } from "@/domain/entities";
import { splitAdvertisementsByPremium } from "@/shared/utils/advertisement-listings";
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
      {regular.length > 0 && (
        <AdvertisementSection
          title={regularTitle}
          description={regularDescription}
          advertisements={regular}
          viewAllHref={viewAllHref}
          returnTo={returnTo}
        />
      )}
    </>
  );
}
