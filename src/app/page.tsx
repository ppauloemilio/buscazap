import { getDashboardData } from "@/application/services/dashboard-service";
import { HeroSearch } from "@/features/dashboard/components/hero-search";
import { UrgentSearches } from "@/features/dashboard/components/urgent-searches";
import { StatsSection } from "@/features/dashboard/components/stats-section";
import { CategoryGrid } from "@/features/dashboard/components/category-grid";
import { AdvertisementSection } from "@/features/dashboard/components/advertisement-section";
import { CityExplorer } from "@/features/dashboard/components/city-explorer";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";

export default async function HomePage() {
  const [data, provider] = await Promise.all([
    getDashboardData(),
    getCurrentProvider(),
  ]);
  const isAdmin = provider ? isAdminProvider(provider) : false;
  const { homepageSettings } = data;

  return (
    <>
      <HeroSearch
        cities={data.cityNames}
        neighborhoodsByCity={data.neighborhoodsByCity}
        categories={data.categories.map((category) => ({
          name: category.name,
          slug: category.slug,
          icon: category.icon,
        }))}
      />
      {homepageSettings.showUrgentSearches && <UrgentSearches />}
      {isAdmin && <StatsSection stats={data.stats} />}
      <AdvertisementSection
        title="Anúncios"
        advertisements={data.homeAdvertisements}
        viewAllHref="/buscar"
      />
      {homepageSettings.showPopularCategories && (
        <CategoryGrid categories={data.categories} />
      )}
      {homepageSettings.showCityExplorer && (
        <CityExplorer cities={data.cityNames} />
      )}
    </>
  );
}
