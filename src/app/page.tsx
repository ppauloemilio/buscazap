import { getDashboardData } from "@/application/services/dashboard-service";
import { HeroSearch } from "@/features/dashboard/components/hero-search";
import { UrgentSearches } from "@/features/dashboard/components/urgent-searches";
import { StatsSection } from "@/features/dashboard/components/stats-section";
import { CategoryGrid } from "@/features/dashboard/components/category-grid";
import { AdvertisementSection } from "@/features/dashboard/components/advertisement-section";
import { CityExplorer } from "@/features/dashboard/components/city-explorer";
import { HowItWorks } from "@/features/dashboard/components/how-it-works";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";

export default async function HomePage() {
  const [data, provider] = await Promise.all([
    getDashboardData(),
    getCurrentProvider(),
  ]);
  const isAdmin = provider ? isAdminProvider(provider) : false;

  return (
    <>
      <HeroSearch cities={data.cityNames} />
      <UrgentSearches />
      {isAdmin && <StatsSection stats={data.stats} />}
      <AdvertisementSection
        title="Anúncios Premium"
        description="Destaques selecionados com maior visibilidade"
        advertisements={data.premiumAdvertisements}
        viewAllHref="/buscar?premium=true"
      />
      <CategoryGrid categories={data.categories} />
      <AdvertisementSection
        title="Adicionados recentemente"
        description="Os anúncios mais novos da plataforma"
        advertisements={data.recentAdvertisements}
        viewAllHref="/buscar?sort=recent"
      />
      <CityExplorer cities={data.cityNames} />
      <AdvertisementSection
        title="Mais populares"
        description="Os mais bem avaliados pelos consumidores"
        advertisements={data.popularAdvertisements}
        viewAllHref="/buscar?sort=popular"
      />
      <HowItWorks />
    </>
  );
}
