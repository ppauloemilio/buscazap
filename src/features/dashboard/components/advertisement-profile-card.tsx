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
      <article className="overflow-hidden rounded-xl border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <h3 className="line-clamp-1 text-sm font-semibold">
              {advertisement.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {advertisement.category}
            </p>
          </div>
          <FavoriteButton advertisementId={advertisement.id} />
        </div>
        <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{locationLabel}</span>
        </div>
        <Button variant="whatsapp" size="sm" className="h-8 w-full text-xs" asChild>
          <TrackedWhatsAppLink
            href={whatsappLink}
            advertisementId={advertisement.id}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </TrackedWhatsAppLink>
        </Button>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        emphasizePremium &&
          advertisement.isPremium &&
          "ring-2 ring-amber-400/70"
      )}
    >
      <div className="relative aspect-[16/9] bg-muted">
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
        {advertisement.imageUrl && (
          <div className="absolute -bottom-6 left-3 h-14 w-14 overflow-hidden rounded-lg border-2 border-background bg-muted shadow">
            <AdvertisementCover
              title={advertisement.title}
              category={advertisement.category}
              imageUrl={advertisement.imageUrl}
              compact
              fit="cover"
            />
          </div>
        )}
      </div>

      <div className="space-y-2 px-3 pb-3 pt-8">
        <div>
          <Link href={detailHref} onClick={handleOpenDetail}>
            <h3 className="line-clamp-1 text-base font-semibold hover:text-whatsapp">
              {advertisement.title}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground">
            {advertisement.category}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {advertisement.subscriptionActive && (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800"
            >
              <CheckCircle2 className="h-3 w-3" />
              Verificado
            </Badge>
          )}
          {open === true && (
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800"
            >
              Aberto
            </Badge>
          )}
          {open === false && (
            <Badge variant="secondary" className="text-[10px]">
              Fechado
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{locationLabel}</span>
        </div>

        {hasReviews && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">
              {formatRating(advertisement.rating)}
            </span>
            <span>({advertisement.reviewCount})</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="h-9 flex-1 text-xs" asChild>
            <Link href={detailHref} onClick={handleOpenDetail}>
              Ver empresa
            </Link>
          </Button>
          <Button variant="whatsapp" size="sm" className="h-9 flex-1 text-xs" asChild>
            <TrackedWhatsAppLink
              href={whatsappLink}
              advertisementId={advertisement.id}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </TrackedWhatsAppLink>
          </Button>
        </div>
      </div>
    </article>
  );
}
