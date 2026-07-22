import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, MapPin, MessageCircle, Crown, ArrowLeft, Clock, Zap } from "lucide-react";
import { getAdvertisementById } from "@/application/services/search-service";
import { listAdvertisementReviews } from "@/application/services/review-service";
import { AdvertisementCover } from "@/components/advertisement/advertisement-cover";
import { AdvertisementDescription } from "@/components/advertisement/advertisement-description";
import { AdvertisementGallery } from "@/components/advertisement/advertisement-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteButton } from "@/features/favorites/favorite-button";
import { ReviewForm } from "@/features/dashboard/components/review-form";
import { StickyWhatsAppCta } from "@/features/dashboard/components/sticky-whatsapp-cta";
import {
  formatAdvertisementLocation,
  getServiceAreaLabel,
} from "@/config/service-area";
import {
  buildWhatsAppLink,
  formatRating,
  getAdvertisementTypeLabel,
} from "@/shared/utils/format";

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

  return {
    title: advertisement.title,
    description: advertisement.description,
  };
}

export default async function AdvertisementPage({ params }: AdvertisementPageProps) {
  const { id } = await params;
  const advertisement = await getAdvertisementById(id);

  if (!advertisement) {
    notFound();
  }

  const reviews = await listAdvertisementReviews(advertisement.id);

  const message = `Olá! Vi seu anúncio "${advertisement.title}" no BuscaZapp e gostaria de mais informações.`;
  const primaryLabel = advertisement.whatsappLabel?.trim() || "WhatsApp";
  const whatsappLink = buildWhatsAppLink(advertisement.whatsappNumber, message);
  const secondaryLink = advertisement.secondaryWhatsappNumber
    ? buildWhatsAppLink(advertisement.secondaryWhatsappNumber, message)
    : null;
  const secondaryLabel =
    advertisement.secondaryWhatsappLabel?.trim() || "WhatsApp 2";

  const stickyContacts = [
    {
      href: whatsappLink,
      label: secondaryLink ? primaryLabel : "Chamar no WhatsApp",
    },
    ...(secondaryLink
      ? [{ href: secondaryLink, label: secondaryLabel }]
      : []),
  ];

  const locationLabel = formatAdvertisementLocation({
    city: advertisement.location.city,
    state: advertisement.location.state,
    neighborhood: advertisement.location.neighborhood,
  });
  const serviceAreaLabel = getServiceAreaLabel(advertisement.serviceArea);

  const hasReviews = advertisement.reviewCount > 0;

  return (
    <section className="container mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href="/buscar"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para busca
        </Link>
        <FavoriteButton advertisementId={advertisement.id} size="sm" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative">
          {advertisement.isPremium &&
          advertisement.imageUrl &&
          (advertisement.galleryImages?.length ?? 0) > 0 ? (
            <AdvertisementGallery
              coverImageUrl={advertisement.imageUrl}
              galleryImages={advertisement.galleryImages}
              title={advertisement.title}
            />
          ) : (
            <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted sm:aspect-[4/3]">
              <AdvertisementCover
                title={advertisement.title}
                category={advertisement.category}
                imageUrl={advertisement.imageUrl}
                priority
                fit="contain"
              />
            </div>
          )}
          {advertisement.isPremium && (
            <Badge variant="premium" className="absolute left-4 top-4 gap-1">
              <Crown className="h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{advertisement.category}</Badge>
            <Badge variant="secondary">
              {getAdvertisementTypeLabel(advertisement.type)}
            </Badge>
            {hasReviews && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">
                  {formatRating(advertisement.rating)}
                </span>
                <span>({advertisement.reviewCount} avaliações)</span>
              </div>
            )}
          </div>

          <h1 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
            {advertisement.title}
          </h1>

          <AdvertisementDescription
            text={advertisement.description}
            className="mb-4 text-base leading-relaxed"
          />

          <div className="mb-4 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-whatsapp" />
              <span className="font-medium text-foreground">{locationLabel}</span>
            </div>
            {serviceAreaLabel && (
              <p className="pl-6 text-sm text-muted-foreground">
                Atendimento: {serviceAreaLabel}
              </p>
            )}
          </div>

          {(advertisement.providerBusinessHours ||
            advertisement.providerResponseHint ||
            advertisement.providerName) && (
            <div className="mb-4 space-y-1.5 rounded-lg border bg-muted/30 p-3 text-sm">
              {advertisement.providerName && (
                <p className="font-medium">{advertisement.providerName}</p>
              )}
              {advertisement.providerBusinessHours && (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-whatsapp" />
                  {advertisement.providerBusinessHours}
                </p>
              )}
              {advertisement.providerResponseHint && (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 shrink-0 text-whatsapp" />
                  {advertisement.providerResponseHint}
                </p>
              )}
            </div>
          )}

          <div className="hidden flex-wrap gap-2 md:flex">
            <Button variant="whatsapp" size="lg" className="w-full sm:w-auto" asChild>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
                {secondaryLink
                  ? primaryLabel
                  : "Entrar em contato via WhatsApp"}
              </a>
            </Button>
            {secondaryLink && (
              <Button variant="whatsapp" size="lg" className="w-full sm:w-auto" asChild>
                <a
                  href={secondaryLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-5 w-5" />
                  {secondaryLabel}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-base">Avaliar este anúncio</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ReviewForm advertisementId={advertisement.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-base">
              Avaliações ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-0">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há avaliações. Seja o primeiro a avaliar.
              </p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-lg border px-2.5 py-2">
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{review.authorName}</p>
                    <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {review.rating}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <StickyWhatsAppCta contacts={stickyContacts} />
    </section>
  );
}
