import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdvertisementByCategoryAndSlug } from "@/application/services/search-service";
import { resolveCategoryCityLanding } from "@/application/services/city-seo-service";
import { AdvertisementDetailView } from "@/features/dashboard/components/advertisement-detail-view";
import {
  buildCategoryCityMetadata,
  CategoryCityLandingPage,
} from "@/features/cities/category-city-landing";
import { isReservedTopLevelSegment } from "@/lib/slug";

interface SeoAdvertisementPageProps {
  readonly params: Promise<{
    readonly categorySlug: string;
    readonly adSlug: string;
  }>;
  readonly searchParams: Promise<{
    readonly from?: string;
  }>;
}

export async function generateMetadata({
  params,
}: SeoAdvertisementPageProps): Promise<Metadata> {
  const { categorySlug, adSlug } = await params;

  const categoryCity = await resolveCategoryCityLanding(categorySlug, adSlug);
  if (categoryCity) {
    return buildCategoryCityMetadata(categoryCity);
  }

  if (isReservedTopLevelSegment(categorySlug)) {
    return { title: "Página não encontrada" };
  }

  const advertisement = await getAdvertisementByCategoryAndSlug(
    categorySlug,
    adSlug
  );

  if (!advertisement) {
    return { title: "Anúncio não encontrado" };
  }

  return {
    title: advertisement.title,
    description: advertisement.description,
    alternates: {
      canonical: advertisement.publicHref,
    },
    openGraph: {
      title: advertisement.title,
      description: advertisement.description,
      type: "website",
      url: advertisement.publicHref,
    },
  };
}

export default async function SeoAdvertisementPage({
  params,
  searchParams,
}: SeoAdvertisementPageProps) {
  const { categorySlug, adSlug } = await params;
  const { from } = await searchParams;

  const categoryCity = await resolveCategoryCityLanding(categorySlug, adSlug);
  if (categoryCity) {
    return <CategoryCityLandingPage {...categoryCity} />;
  }

  if (isReservedTopLevelSegment(categorySlug)) {
    notFound();
  }

  const advertisement = await getAdvertisementByCategoryAndSlug(
    categorySlug,
    adSlug
  );

  if (!advertisement) {
    notFound();
  }

  return (
    <AdvertisementDetailView advertisement={advertisement} returnTo={from} />
  );
}
