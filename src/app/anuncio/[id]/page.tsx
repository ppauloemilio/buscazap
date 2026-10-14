import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdvertisementById } from "@/application/services/search-service";
import { AdvertisementDetailView } from "@/features/dashboard/components/advertisement-detail-view";
import { buildAdvertisementMetadata } from "@/lib/seo/advertisement-seo";

interface AdvertisementPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export async function generateMetadata({
  params,
}: AdvertisementPageProps): Promise<Metadata> {
  const { id } = await params;
  const advertisement = await getAdvertisementById(id);

  if (!advertisement) {
    return { title: "Anúncio não encontrado" };
  }

  return buildAdvertisementMetadata(advertisement);
}

/** Mantém /anuncio/:id e redireciona para URL SEO quando disponível. */
export default async function AdvertisementByIdPage({
  params,
}: AdvertisementPageProps) {
  const { id } = await params;
  const advertisement = await getAdvertisementById(id);

  if (!advertisement) {
    notFound();
  }

  if (advertisement.publicHref) {
    redirect(advertisement.publicHref);
  }

  return <AdvertisementDetailView advertisement={advertisement} />;
}
