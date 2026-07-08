import { getDashboardData } from "@/application/services/dashboard-service";
import { HeroSearch } from "@/features/dashboard/components/hero-search";
import { StatsSection } from "@/features/dashboard/components/stats-section";
import { CategoryGrid } from "@/features/dashboard/components/category-grid";
import { AdvertisementSection } from "@/features/dashboard/components/advertisement-section";
import { CityExplorer } from "@/features/dashboard/components/city-explorer";
import { HowItWorks } from "@/features/dashboard/components/how-it-works";

export default async function HomePage() {
  const data = await getDashboardData();

  return (
    <>
      <HeroSearch cities={data.cityNames} />
      <StatsSection stats={data.stats} />
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
