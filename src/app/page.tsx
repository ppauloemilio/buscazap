import { getDashboardData } from "@/application/services/dashboard-service";
import { HeroSearch } from "@/features/dashboard/components/hero-search";
import { UrgentSearches } from "@/features/dashboard/components/urgent-searches";
import { StatsSection } from "@/features/dashboard/components/stats-section";
import { CategoryGrid } from "@/features/dashboard/components/category-grid";
import { AdvertisementListings } from "@/features/dashboard/components/advertisement-listings";
import { AdvertisementSection } from "@/features/dashboard/components/advertisement-section";
import { CityExplorer } from "@/features/dashboard/components/city-explorer";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";

export default async function HomePage() {
  const provider = await getCurrentProvider();
  const isAdmin = provider ? isAdminProvider(provider) : false;
  const data = await getDashboardData({ includeStats: isAdmin });
  const { homepageSettings } = data;

  return (
    <>
      <HeroSearch
        cities={data.cityNames}
        neighborhoodsByCity={data.neighborhoodsByCity}
      />
      {homepageSettings.showPopularCategories && (
        <CategoryGrid categories={data.popularCategories} />
      )}
      {homepageSettings.showUrgentSearches && <UrgentSearches />}
      {isAdmin && <StatsSection stats={data.stats} />}
      {isNewAdProfileEnabled() ? (
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
      )}
      {homepageSettings.showCityExplorer && (
        <CityExplorer cities={data.cityNames} />
      )}
    </>
  );
}
