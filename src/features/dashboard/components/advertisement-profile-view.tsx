"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  MapPin,
  MessageCircle,
  Clock,
  Globe,
  Instagram,
  CheckCircle2,
} from "lucide-react";
import { AdvertisementCover } from "@/components/advertisement/advertisement-cover";
import { AdvertisementDescription } from "@/components/advertisement/advertisement-description";
import {
  TrackAdView,
  TrackedWhatsAppLink,
} from "@/components/analytics/analytics-trackers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/features/favorites/favorite-button";
import { AdvertisementBackLink } from "@/features/dashboard/components/advertisement-back-link";
import { ReviewForm } from "@/features/dashboard/components/review-form";
import { StickyWhatsAppCta } from "@/features/dashboard/components/sticky-whatsapp-cta";
import { formatAdvertisementLocation } from "@/config/service-area";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import type { Advertisement } from "@/domain/entities";
import {
  buildWhatsAppLink,
  formatRating,
} from "@/shared/utils/format";
import {
  formatBusinessHoursList,
  isOpenNow,
  parseBusinessHoursJson,
} from "@/shared/utils/business-hours";
import { cn } from "@/lib/utils";

type ProfileTab = "descricao" | "produtos" | "servicos" | "avaliacoes";

interface ReviewItem {
  readonly id: string;
  readonly authorName: string;
  readonly rating: number;
  readonly comment: string | null;
  readonly createdAt: Date | string;
}

interface AdvertisementProfileViewProps {
  readonly advertisement: Advertisement;
  readonly reviews: readonly ReviewItem[];
}

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "descricao", label: "Descrição" },
  { id: "produtos", label: "Produtos" },
  { id: "servicos", label: "Serviços" },
  { id: "avaliacoes", label: "Avaliações" },
];

export function AdvertisementProfileView({
  advertisement,
  reviews,
}: AdvertisementProfileViewProps) {
  const [tab, setTab] = useState<ProfileTab>("descricao");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const isFree = advertisement.plan === "free";

  const message = `Olá! Vi seu anúncio "${advertisement.title}" no BuscaZapp e gostaria de mais informações.`;
  const whatsappLink = buildWhatsAppLink(advertisement.whatsappNumber, message);
  const locationLabel = formatAdvertisementLocation({
    city: advertisement.location.city,
    state: advertisement.location.state,
    neighborhood: advertisement.location.neighborhood,
  });
  const hours = parseBusinessHoursJson(advertisement.businessHoursJson);
  const open = isOpenNow(hours);
  const hoursList = formatBusinessHoursList(hours);
  // Galeria = fotos extras (sem repetir a capa do topo)
  const gallery = (advertisement.galleryImages ?? []).slice(
    0,
    advertisement.isPremium
      ? PRICING.PREMIUM_MAX_GALLERY
      : PRICING.PAID_MAX_GALLERY
  );
  const hasReviews = advertisement.reviewCount > 0;

  if (isFree) {
    return (
      <section className="container mx-auto max-w-lg px-4 py-6 pb-24">
        <TrackAdView advertisementId={advertisement.id} />
        <div className="mb-4 flex items-center justify-between">
          <AdvertisementBackLink />
          <FavoriteButton advertisementId={advertisement.id} size="sm" />
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h1 className="text-xl font-bold">{advertisement.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {advertisement.category}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-whatsapp" />
            {locationLabel}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Listagem básica. O anunciante pode ampliar o perfil com a assinatura.
          </p>
          <Button variant="whatsapp" className="mt-5 w-full" asChild>
            <TrackedWhatsAppLink
              href={whatsappLink}
              advertisementId={advertisement.id}
            >
              <MessageCircle className="h-4 w-4" />
              Chamar no WhatsApp
            </TrackedWhatsAppLink>
          </Button>
        </div>
        <StickyWhatsAppCta
          advertisementId={advertisement.id}
          contacts={[{ href: whatsappLink, label: "Chamar no WhatsApp" }]}
        />
      </section>
    );
  }

  return (
    <section className="pb-24 md:pb-8">
      <TrackAdView advertisementId={advertisement.id} />

      <div className="relative h-48 w-full bg-muted md:h-64">
        <AdvertisementCover
          title={advertisement.title}
          category={advertisement.category}
          imageUrl={advertisement.imageUrl}
          priority
          fit="cover"
        />
        <div className="absolute right-3 top-3">
          <FavoriteButton advertisementId={advertisement.id} size="sm" />
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4">
        <div className="mb-4">
          <AdvertisementBackLink />
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {advertisement.logoUrl ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-muted">
                <AdvertisementCover
                  title={advertisement.title}
                  category={advertisement.category}
                  imageUrl={advertisement.logoUrl}
                  compact
                  fit="cover"
                />
              </div>
            ) : null}
            <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold md:text-2xl">
                {advertisement.title}
              </h1>
              {advertisement.subscriptionActive && (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-800"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Verificado
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="border border-border bg-muted text-muted-foreground"
              >
                {advertisement.category}
              </Badge>
            </div>
            {hasReviews && (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">
                  {formatRating(advertisement.rating)}
                </span>
                <span>({advertisement.reviewCount})</span>
              </div>
            )}
            </div>
          </div>
          <Button variant="whatsapp" size="lg" className="shrink-0" asChild>
            <TrackedWhatsAppLink
              href={whatsappLink}
              advertisementId={advertisement.id}
            >
              <MessageCircle className="h-4 w-4" />
              Chamar no WhatsApp
            </TrackedWhatsAppLink>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {gallery.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {gallery.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setLightboxUrl(url)}
                    className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted transition hover:opacity-90 sm:h-24 sm:w-24"
                    aria-label="Ampliar foto da galeria"
                  >
                    <Image
                      src={url}
                      alt={advertisement.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </button>
                ))}
              </div>
            )}

            {lightboxUrl && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                role="dialog"
                aria-modal="true"
                aria-label="Foto ampliada"
                onClick={() => setLightboxUrl(null)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setLightboxUrl(null);
                }}
              >
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-foreground"
                  onClick={() => setLightboxUrl(null)}
                >
                  Fechar
                </button>
                <div
                  className="relative h-[min(80vh,720px)] w-full max-w-3xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Image
                    src={lightboxUrl}
                    alt={advertisement.title}
                    fill
                    className="object-contain"
                    sizes="(max-width:768px) 100vw, 768px"
                    priority
                  />
                </div>
              </div>
            )}

            <div className="border-b">
              <nav className="flex gap-4 overflow-x-auto">
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "shrink-0 border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
                      tab === item.id
                        ? "border-whatsapp text-whatsapp"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="min-h-[160px]">
              {tab === "descricao" && (
                <AdvertisementDescription
                  text={advertisement.description || "Sem descrição cadastrada."}
                  className="text-base leading-relaxed"
                />
              )}

              {tab === "produtos" && (
                <div>
                  {(advertisement.products?.length ?? 0) === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      Nenhum produto cadastrado
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {advertisement.products?.map((product) => (
                        <div
                          key={product.id}
                          className="overflow-hidden rounded-xl border bg-card"
                        >
                          <div className="relative aspect-[4/3] bg-muted">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.title}
                                fill
                                className="object-cover"
                                sizes="200px"
                              />
                            ) : null}
                          </div>
                          <div className="space-y-1 p-3">
                            <p className="text-sm font-semibold">
                              {product.title}
                            </p>
                            <p className="text-sm font-semibold text-whatsapp">
                              {formatPriceBRL(product.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "servicos" && (
                <div>
                  {(advertisement.services?.length ?? 0) === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      Nenhum serviço cadastrado
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {advertisement.services?.map((service) => (
                        <div
                          key={service.id}
                          className="flex gap-3 rounded-xl border bg-card p-3"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {service.imageUrl ? (
                              <Image
                                src={service.imageUrl}
                                alt={service.title}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold">{service.title}</p>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {service.description}
                            </p>
                            {typeof service.priceFrom === "number" && (
                              <p className="mt-1 text-sm font-semibold text-whatsapp">
                                A partir de {formatPriceBRL(service.priceFrom)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "avaliacoes" && (
                <div className="space-y-4">
                  <ReviewForm advertisementId={advertisement.id} />
                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Ainda não há avaliações.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <article
                          key={review.id}
                          className="rounded-xl border bg-card p-4"
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="font-semibold">{review.authorName}</p>
                            <time className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString(
                                "pt-BR"
                              )}
                            </time>
                          </div>
                          <div className="mb-2 flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  index < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/40"
                                )}
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">
                              {review.comment}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-sky-600" />
                Endereço
              </div>
              <p className="text-sm text-muted-foreground">
                {advertisement.streetAddress
                  ? `${advertisement.streetAddress} — ${locationLabel}`
                  : locationLabel}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Clock className="h-4 w-4 text-sky-600" />
                  Horário de funcionamento
                </div>
                {open === true && (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    Aberto
                  </Badge>
                )}
                {open === false && (
                  <Badge variant="secondary">Fechado</Badge>
                )}
              </div>
              {hoursList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {advertisement.providerBusinessHours ||
                    "Horário não informado"}
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {hoursList.map((row) => (
                    <li
                      key={row.label}
                      className="flex justify-between gap-2 text-muted-foreground"
                    >
                      <span>{row.label}</span>
                      <span className="font-medium text-foreground">
                        {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(advertisement.instagram || advertisement.website) && (
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-2 font-semibold">Contato</p>
                <ul className="space-y-2 text-sm">
                  {advertisement.instagram && (
                    <li>
                      <a
                        href={
                          advertisement.instagram.startsWith("http")
                            ? advertisement.instagram
                            : `https://instagram.com/${advertisement.instagram.replace(/^@/, "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Instagram className="h-4 w-4 text-sky-600" />
                        {advertisement.instagram}
                      </a>
                    </li>
                  )}
                  {advertisement.website && (
                    <li>
                      <a
                        href={
                          advertisement.website.startsWith("http")
                            ? advertisement.website
                            : `https://${advertisement.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Globe className="h-4 w-4 text-sky-600" />
                        {advertisement.website.replace(/^https?:\/\//, "")}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            <p className="text-right text-xs text-muted-foreground">
              Encontrou uma informação errada?{" "}
              <Link href="/denunciar" className="underline hover:text-foreground">
                Fale conosco
              </Link>
              .
            </p>
          </aside>
        </div>
      </div>

      <StickyWhatsAppCta
        advertisementId={advertisement.id}
        contacts={[{ href: whatsappLink, label: "Chamar no WhatsApp" }]}
      />
    </section>
  );
}
