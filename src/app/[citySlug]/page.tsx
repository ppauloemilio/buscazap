import { notFound } from "next/navigation";
import {
  getActiveSeoCityBySlug,
} from "@/application/services/city-seo-service";
import {
  buildCityMetadata,
  CityLandingPage,
} from "@/features/cities/city-landing";
import { isReservedTopLevelSegment } from "@/lib/slug";

export const dynamic = "force-dynamic";

interface CitySeoPageProps {
  readonly params: Promise<{ readonly citySlug: string }>;
}

export async function generateMetadata({ params }: CitySeoPageProps) {
  const { citySlug } = await params;
  const city = await getActiveSeoCityBySlug(citySlug);

  if (!city) {
    return { title: "Cidade não encontrada" };
  }

  return buildCityMetadata(city);
}

export default async function CitySeoPage({ params }: CitySeoPageProps) {
  const { citySlug } = await params;

  if (isReservedTopLevelSegment(citySlug)) {
    notFound();
  }

  const city = await getActiveSeoCityBySlug(citySlug);
  if (!city) {
    notFound();
  }

  return <CityLandingPage city={city} />;
}
