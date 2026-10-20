import type { ReactNode } from "react";
import { getDashboardData } from "@/application/services/dashboard-service";
import type { HomepageSectionId } from "@/application/services/homepage-settings-service";
import { listHomePromotionCards } from "@/application/services/public-promotions-service";
import { listHomeCouponCards } from "@/application/services/public-coupons-service";
import { HeroSearch } from "@/features/dashboard/components/hero-search";
import { UrgentSearches } from "@/features/dashboard/components/urgent-searches";
import { StatsSection } from "@/features/dashboard/components/stats-section";
import { CategoryGrid } from "@/features/dashboard/components/category-grid";
import { AdvertisementSection } from "@/features/dashboard/components/advertisement-section";
import { CityExplorer } from "@/features/dashboard/components/city-explorer";
import { PromotionsSection } from "@/features/dashboard/components/promotions-section";
import { CouponsSection } from "@/features/dashboard/components/coupons-section";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";
import {
  splitAdvertisementsByPlan,
  splitAdvertisementsByPremium,
} from "@/shared/utils/advertisement-listings";

function resolveDefaultCityName(cityNames: readonly string[]): string | undefined {
  return (
    cityNames.find(
      (name) =>
        name.localeCompare("Belém", "pt-BR", { sensitivity: "base" }) === 0
    ) ?? cityNames[0]
  );
}

export default async function HomePage() {
  const provider = await getCurrentProvider();
  const isAdmin = provider ? isAdminProvider(provider) : false;
  const data = await getDashboardData({ includeStats: isAdmin });
  const { homepageSettings } = data;
  const homePromotions = homepageSettings.showPromotions
    ? await listHomePromotionCards()
    : { items: [], total: 0 };
  const homeCoupons = homepageSettings.showCoupons
    ? await listHomeCouponCards()
    : { items: [], total: 0 };
  const defaultCityName = resolveDefaultCityName(data.cityNames);

  const allHomeAds = [
    ...data.homePremiumAdvertisements,
    ...data.homeRegularAdvertisements,
  ];
  const { premium, regular } = splitAdvertisementsByPremium(allHomeAds);
  const freemium = isNewAdProfileEnabled();
  const { paid, free } = freemium
    ? splitAdvertisementsByPlan(regular)
    : { paid: regular, free: [] };

  const sectionRenderers: Record<HomepageSectionId, () => ReactNode> = {
    popularCategories: () =>
      homepageSettings.showPopularCategories ? (
        <CategoryGrid
          categories={data.popularCategories}
          defaultCityName={defaultCityName}
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
    coupons: () =>
      homepageSettings.showCoupons ? (
        <CouponsSection
          coupons={homeCoupons.items}
          total={homeCoupons.total}
          showWhenEmpty
        />
      ) : null,
    premiumAds: () =>
      homepageSettings.showPremiumAds && premium.length > 0 ? (
        <AdvertisementSection
          variant="premium"
          title="Destaques Premium"
          description="Anunciantes em destaque — contato direto pelo WhatsApp"
          advertisements={premium}
          viewAllHref="/buscar?premium=true"
          returnTo="/"
          emphasizePremium
        />
      ) : null,
    paidAds: () =>
      homepageSettings.showPaidAds && paid.length > 0 ? (
        <AdvertisementSection
          title="Anúncios"
          advertisements={paid}
          viewAllHref={freemium ? "/buscar?plan=paid" : "/buscar"}
          returnTo="/"
        />
      ) : null,
    freeAds: () =>
      homepageSettings.showFreeAds && free.length > 0 ? (
        <AdvertisementSection
          variant="free"
          compact
          title="Plano Grátis"
          advertisements={free}
          viewAllHref="/buscar?plan=free"
          returnTo="/"
        />
      ) : null,
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
