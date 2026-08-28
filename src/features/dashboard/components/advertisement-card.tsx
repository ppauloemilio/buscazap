"use client";

import Link from "next/link";
import { Star, MapPin, MessageCircle, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdvertisementCover } from "@/components/advertisement/advertisement-cover";
import { TrackedWhatsAppLink } from "@/components/analytics/analytics-trackers";
import { FavoriteButton } from "@/features/favorites/favorite-button";
import {
  formatAdvertisementLocation,
  getServiceAreaLabel,
} from "@/config/service-area";
import type { Advertisement } from "@/domain/entities";
import {
  buildWhatsAppLink,
  formatRating,
  getAdvertisementTypeLabel,
} from "@/shared/utils/format";
import {
  buildAdvertisementHref,
  rememberReturnPath,
} from "@/shared/utils/search-preferences";

interface AdvertisementCardProps {
  readonly advertisement: Advertisement;
  readonly returnTo?: string;
  readonly emphasizePremium?: boolean;
}

export function AdvertisementCard({
  advertisement,
  returnTo,
  emphasizePremium = false,
}: AdvertisementCardProps) {
  const primaryLabel = advertisement.whatsappLabel?.trim() || "WhatsApp";
  const whatsappLink = buildWhatsAppLink(
    advertisement.whatsappNumber,
    `Olá! Vi seu anúncio "${advertisement.title}" no BuscaZapp e gostaria de mais informações.`
  );
  const secondaryLink = advertisement.secondaryWhatsappNumber
    ? buildWhatsAppLink(
        advertisement.secondaryWhatsappNumber,
        `Olá! Vi seu anúncio "${advertisement.title}" no BuscaZapp e gostaria de mais informações.`
      )
    : null;
  const secondaryLabel =
    advertisement.secondaryWhatsappLabel?.trim() || "WhatsApp 2";

  const locationLabel = formatAdvertisementLocation({
    city: advertisement.location.city,
    neighborhood: advertisement.location.neighborhood,
  });
  const serviceAreaLabel = getServiceAreaLabel(advertisement.serviceArea);

  const hasReviews = advertisement.reviewCount > 0;
  const detailHref = buildAdvertisementHref({
    publicHref: advertisement.publicHref,
    id: advertisement.id,
  });

  function handleOpenDetail() {
    rememberReturnPath(returnTo);
  }

  const showPremiumEmphasis =
    emphasizePremium && advertisement.isPremium;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-shadow hover:shadow-md",
        showPremiumEmphasis &&
          "ring-2 ring-amber-400/70 shadow-sm hover:shadow-lg dark:ring-amber-500/50"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <AdvertisementCover
          title={advertisement.title}
          category={advertisement.category}
          imageUrl={advertisement.imageUrl}
          compact
          fit="contain"
        />
        {advertisement.isPremium && (
          <Badge
            variant="premium"
            className="absolute left-1.5 top-1.5 gap-0.5 px-1.5 py-0 text-[10px] leading-4"
          >
            <Crown className="h-2.5 w-2.5" />
            Premium
          </Badge>
        )}
        <Badge
          variant="secondary"
          className="absolute right-1.5 top-1.5 bg-background/90 px-1.5 py-0 text-[10px] leading-4"
        >
          {getAdvertisementTypeLabel(advertisement.type)}
        </Badge>
        <div className="absolute bottom-1.5 right-1.5">
          <FavoriteButton advertisementId={advertisement.id} />
        </div>
      </div>

      <CardContent className="space-y-1.5 p-2.5">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] leading-4">
            {advertisement.category}
          </Badge>
          {hasReviews && (
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {formatRating(advertisement.rating)}
              </span>
              <span>({advertisement.reviewCount})</span>
            </div>
          )}
        </div>

        <Link href={detailHref} onClick={handleOpenDetail}>
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors hover:text-whatsapp">
            {advertisement.title}
          </h3>
        </Link>

        <p className="line-clamp-2 whitespace-pre-line text-[11px] leading-snug text-muted-foreground">
          {advertisement.description}
        </p>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="line-clamp-1 font-medium text-foreground/80">
              {locationLabel}
            </span>
          </div>
          {serviceAreaLabel && (
            <p className="pl-3.5 text-[10px] text-muted-foreground">
              {serviceAreaLabel}
            </p>
          )}
        </div>

        <div className="flex gap-1.5 pt-0.5">
            <Button
              variant="whatsapp"
              size="sm"
              className="h-8 min-w-0 flex-1 px-2 text-xs font-semibold"
              asChild
            >
              <TrackedWhatsAppLink
                href={whatsappLink}
                advertisementId={advertisement.id}
                aria-label={`Contatar ${advertisement.title} via WhatsApp (${primaryLabel})`}
                className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-whatsapp px-2 text-xs font-semibold text-whatsapp-foreground"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {secondaryLink ? primaryLabel : "WhatsApp"}
                </span>
              </TrackedWhatsAppLink>
            </Button>
            {secondaryLink && (
              <Button
                variant="whatsapp"
                size="sm"
                className="h-8 min-w-0 flex-1 px-2 text-xs font-semibold"
                asChild
              >
                <TrackedWhatsAppLink
                  href={secondaryLink}
                  advertisementId={advertisement.id}
                  aria-label={`Contatar ${advertisement.title} via WhatsApp (${secondaryLabel})`}
                  className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-whatsapp px-2 text-xs font-semibold text-whatsapp-foreground"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{secondaryLabel}</span>
                </TrackedWhatsAppLink>
              </Button>
            )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-[11px]"
            asChild
          >
            <Link href={detailHref} onClick={handleOpenDetail}>
              Ver
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
