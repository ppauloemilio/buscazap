import type { ReactNode } from "react";
import { getDashboardData } from "@/application/services/dashboard-service";
import type { HomepageSectionId } from "@/application/services/homepage-settings-service";
import { cityNameToSlug } from "@/application/services/city-seo-service";
import { listHomePromotionCards } from "@/application/services/public-promotions-service";
import { HeroSearch } from "@/features/dashboard/components/hero-search";
import { UrgentSearches } from "@/features/dashboard/components/urgent-searches";
import { StatsSection } from "@/features/dashboard/components/stats-section";
import { CategoryGrid } from "@/features/dashboard/components/category-grid";
import { AdvertisementListings } from "@/features/dashboard/components/advertisement-listings";
import { AdvertisementSection } from "@/features/dashboard/components/advertisement-section";
import { CityExplorer } from "@/features/dashboard/components/city-explorer";
import { PromotionsSection } from "@/features/dashboard/components/promotions-section";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";

function resolveDefaultCitySlug(cityNames: readonly string[]): string | undefined {
  const preferred =
    cityNames.find(
      (name) =>
        name.localeCompare("Belém", "pt-BR", { sensitivity: "base" }) === 0
    ) ?? cityNames[0];
  return preferred ? cityNameToSlug(preferred) : undefined;
}

export default async function HomePage() {
  const provider = await getCurrentProvider();
  const isAdmin = provider ? isAdminProvider(provider) : false;
  const data = await getDashboardData({ includeStats: isAdmin });
  const { homepageSettings } = data;
  const homePromotions = homepageSettings.showPromotions
    ? await listHomePromotionCards()
    : { items: [], total: 0 };
  const defaultCitySlug = resolveDefaultCitySlug(data.cityNames);

  const sectionRenderers: Record<HomepageSectionId, () => ReactNode> = {
    popularCategories: () =>
      homepageSettings.showPopularCategories ? (
        <CategoryGrid
          categories={data.popularCategories}
          defaultCitySlug={defaultCitySlug}
        />
      ) : null,
    urgentSearches: () =>
      homepageSettings.showUrgentSearches ? <UrgentSearches /> : null,
    promotions: () =>
      homepageSettings.showPromotions ? (
        <PromotionsSection
          promotions={homePromotions.items}
          total={homePromotions.total}
        />
      ) : null,
    advertisements: () =>
      isNewAdProfileEnabled() ? (
        <AdvertisementListings
          advertisements={[
            ...data.homePremiumAdvertisements,
            ...data.homeRegularAdvertisements,
          ]}
          regularTitle="Anúncios"
          premiumViewAllHref="/buscar?premium=true"
          paidViewAllHref="/buscar?plan=paid"
          freeViewAllHref="/buscar?plan=free"
          returnTo="/"
        />
      ) : (
        <>
          {data.homePremiumAdvertisements.length > 0 && (
            <AdvertisementSection
              variant="premium"
              title="Destaques Premium"
              description="Anunciantes em destaque — contato direto pelo WhatsApp"
              advertisements={data.homePremiumAdvertisements}
              viewAllHref="/buscar?premium=true"
              emphasizePremium
            />
          )}
          {data.homeRegularAdvertisements.length > 0 && (
            <AdvertisementSection
              title="Anúncios"
              advertisements={data.homeRegularAdvertisements}
              viewAllHref="/buscar"
            />
          )}
        </>
      ),
    cityExplorer: () =>
      homepageSettings.showCityExplorer ? (
        <CityExplorer cities={data.cityNames} />
      ) : null,
  };

  return (
    <>
      <HeroSearch
        cities={data.cityNames}
        neighborhoodsByCity={data.neighborhoodsByCity}
      />
      {isAdmin && <StatsSection stats={data.stats} />}
      {homepageSettings.sectionOrder.map((sectionId) => (
        <div key={sectionId}>{sectionRenderers[sectionId]()}</div>
      ))}
    </>
  );
}
