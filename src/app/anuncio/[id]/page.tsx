import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdvertisementById } from "@/application/services/search-service";
import { AdvertisementDetailView } from "@/features/dashboard/components/advertisement-detail-view";

import { isSafeInternalReturnPath } from "@/shared/utils/search-preferences";

interface AdvertisementPageProps {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<{ readonly from?: string }>;
}

export async function generateMetadata({
  params,
}: AdvertisementPageProps): Promise<Metadata> {
  const { id } = await params;
  const advertisement = await getAdvertisementById(id);

  if (!advertisement) {
    return { title: "Anúncio não encontrado" };
  }

  return {
    title: advertisement.title,
    description: advertisement.description,
    alternates: advertisement.publicHref
      ? { canonical: advertisement.publicHref }
      : undefined,
  };
}

/** Mantém /anuncio/:id e redireciona para URL SEO quando disponível. */
export default async function AdvertisementByIdPage({
  params,
  searchParams,
}: AdvertisementPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const advertisement = await getAdvertisementById(id);

  if (!advertisement) {
    notFound();
  }

  if (advertisement.publicHref) {
    const redirectTarget =
      from && isSafeInternalReturnPath(from)
        ? `${advertisement.publicHref}?from=${encodeURIComponent(from)}`
        : advertisement.publicHref;
    redirect(redirectTarget);
  }

  return (
    <AdvertisementDetailView advertisement={advertisement} returnTo={from} />
  );
}
