"use client";

import Link from "next/link";
import { Star, MapPin, MessageCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdvertisementCover } from "@/components/advertisement/advertisement-cover";
import { TrackedWhatsAppLink } from "@/components/analytics/analytics-trackers";
import { FavoriteButton } from "@/features/favorites/favorite-button";
import { formatAdvertisementLocation } from "@/config/service-area";
import type { Advertisement } from "@/domain/entities";
import {
  buildWhatsAppLink,
  formatRating,
} from "@/shared/utils/format";
import {
  buildAdvertisementHref,
  rememberReturnPath,
} from "@/shared/utils/search-preferences";
import {
  isOpenNow,
  parseBusinessHoursJson,
} from "@/shared/utils/business-hours";

interface AdvertisementProfileCardProps {
  readonly advertisement: Advertisement;
  readonly returnTo?: string;
  readonly emphasizePremium?: boolean;
}

export function AdvertisementProfileCard({
  advertisement,
  returnTo,
  emphasizePremium = false,
}: AdvertisementProfileCardProps) {
  const isFree = advertisement.plan === "free";
  const whatsappLink = buildWhatsAppLink(
    advertisement.whatsappNumber,
    `Olá! Vi seu anúncio "${advertisement.title}" no BuscaZapp e gostaria de mais informações.`
  );
  const locationLabel = formatAdvertisementLocation({
    city: advertisement.location.city,
    neighborhood: advertisement.location.neighborhood,
  });
  const detailHref = buildAdvertisementHref({
    publicHref: advertisement.publicHref,
    id: advertisement.id,
  });
  const hasReviews = advertisement.reviewCount > 0;
  const hours = parseBusinessHoursJson(advertisement.businessHoursJson);
  const open = isFree ? null : isOpenNow(hours);

  function handleOpenDetail() {
    rememberReturnPath(returnTo);
  }

  if (isFree) {
    return (
      <article className="h-fit self-start overflow-hidden rounded-lg border bg-card p-2.5 shadow-sm">
        <div className="mb-1.5 flex items-start justify-between gap-1.5">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-xs font-semibold leading-snug">
              {advertisement.title}
            </h3>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {advertisement.category}
            </p>
          </div>
          <FavoriteButton advertisementId={advertisement.id} />
        </div>
        <div className="mb-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="line-clamp-1">{locationLabel}</span>
        </div>
        <Button
          variant="whatsapp"
          size="sm"
          className="h-7 w-full px-2 text-[11px]"
          asChild
        >
          <TrackedWhatsAppLink
            href={whatsappLink}
            advertisementId={advertisement.id}
          >
            <MessageCircle className="h-3 w-3" />
            WhatsApp
          </TrackedWhatsAppLink>
        </Button>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        emphasizePremium &&
          advertisement.isPremium &&
          "ring-2 ring-amber-400/70"
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl bg-muted">
        <AdvertisementCover
          title={advertisement.title}
          category={advertisement.category}
          imageUrl={advertisement.imageUrl}
          compact
          fit="cover"
        />
        <div className="absolute right-2 top-2">
          <FavoriteButton advertisementId={advertisement.id} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col space-y-1.5 px-2.5 pb-2.5 pt-2.5">
        <div className="flex min-w-0 items-start gap-2">
          {advertisement.logoUrl ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
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
            <Link href={detailHref} onClick={handleOpenDetail}>
              <h3 className="line-clamp-1 text-sm font-semibold hover:text-whatsapp">
                {advertisement.title}
              </h3>
            </Link>
            <p className="truncate text-[11px] text-muted-foreground">
              {advertisement.category}
            </p>
          </div>
        </div>

        <div className="flex min-h-[18px] flex-wrap gap-1">
          {advertisement.subscriptionActive && (
            <Badge
              variant="outline"
              className="gap-0.5 border-emerald-300 bg-emerald-50 px-1.5 py-0 text-[9px] leading-4 text-emerald-800"
            >
              <CheckCircle2 className="h-2.5 w-2.5" />
              Verificado
            </Badge>
          )}
          {open === true && (
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 px-1.5 py-0 text-[9px] leading-4 text-emerald-800"
            >
              Aberto
            </Badge>
          )}
          {open === false && (
            <Badge
              variant="secondary"
              className="px-1.5 py-0 text-[9px] leading-4"
            >
              Fechado
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="line-clamp-1">{locationLabel}</span>
        </div>

        {/* Reserva altura fixa para alinhar botões entre cards com/sem avaliação */}
        <div className="flex min-h-[14px] items-center gap-1 text-[10px] text-muted-foreground">
          {hasReviews ? (
            <>
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {formatRating(advertisement.rating)}
              </span>
              <span>({advertisement.reviewCount})</span>
            </>
          ) : (
            <span className="invisible">0.0 (0)</span>
          )}
        </div>

        <div className="mt-auto flex min-w-0 items-center gap-1.5 pt-1">
          <Button
            variant="whatsapp"
            size="sm"
            className="h-8 min-w-0 flex-1 gap-1 rounded-md px-2 text-[11px] font-semibold [&_svg]:size-3.5"
            asChild
          >
            <TrackedWhatsAppLink
              href={whatsappLink}
              advertisementId={advertisement.id}
              className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-md bg-whatsapp px-2 text-[11px] font-semibold text-whatsapp-foreground"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </TrackedWhatsAppLink>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 rounded-md px-2.5 text-[11px]"
            asChild
          >
            <Link href={detailHref} onClick={handleOpenDetail}>
              Ver
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
