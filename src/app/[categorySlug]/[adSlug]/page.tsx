import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getAdvertisementByCategoryAndSlug } from "@/application/services/search-service";
import { resolveCategoryCityLanding } from "@/application/services/city-seo-service";
import { AdvertisementDetailView } from "@/features/dashboard/components/advertisement-detail-view";
import {
  buildCategoryCityMetadata,
  CategoryCityLandingPage,
} from "@/features/cities/category-city-landing";
import { buildAdvertisementMetadata } from "@/lib/seo/advertisement-seo";
import { isReservedTopLevelSegment } from "@/lib/slug";

interface SeoAdvertisementPageProps {
  readonly params: Promise<{
    readonly categorySlug: string;
    readonly adSlug: string;
  }>;
  readonly searchParams: Promise<{
    readonly from?: string;
    readonly tab?: string;
    readonly promo?: string;
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

  return buildAdvertisementMetadata(advertisement);
}

export default async function SeoAdvertisementPage({
  params,
  searchParams,
}: SeoAdvertisementPageProps) {
  const { categorySlug, adSlug } = await params;
  const { from, tab, promo } = await searchParams;

  // Remove ?from= da URL pública (SEO) — o Voltar usa sessionStorage.
  // Mantém tab/promo para deep-link da seção de promoções.
  if (from) {
    const preserved = new URLSearchParams();
    if (tab) preserved.set("tab", tab);
    if (promo) preserved.set("promo", promo);
    const query = preserved.toString();
    permanentRedirect(
      query ? `/${categorySlug}/${adSlug}?${query}` : `/${categorySlug}/${adSlug}`
    );
  }

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

  return <AdvertisementDetailView advertisement={advertisement} />;
}
