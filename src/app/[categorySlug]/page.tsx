import { notFound } from "next/navigation";
import { getActiveSeoCityBySlug } from "@/application/services/city-seo-service";
import {
  buildCityMetadata,
  CityLandingPage,
} from "@/features/cities/city-landing";
import { isReservedTopLevelSegment } from "@/lib/slug";

export const dynamic = "force-dynamic";

interface CitySeoPageProps {
  readonly params: Promise<{ readonly categorySlug: string }>;
}

export async function generateMetadata({ params }: CitySeoPageProps) {
  const { categorySlug } = await params;
  const city = await getActiveSeoCityBySlug(categorySlug);

  if (!city) {
    return { title: "Página não encontrada" };
  }

  return buildCityMetadata(city);
}

export default async function CitySeoPage({ params }: CitySeoPageProps) {
  const { categorySlug } = await params;

  if (isReservedTopLevelSegment(categorySlug)) {
    notFound();
  }

  const city = await getActiveSeoCityBySlug(categorySlug);
  if (!city) {
    notFound();
  }

  return <CityLandingPage city={city} />;
}
