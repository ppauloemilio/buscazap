import Link from "next/link";
import { Star, MapPin, MessageCircle, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdvertisementCover } from "@/components/advertisement/advertisement-cover";
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

interface AdvertisementCardProps {
  readonly advertisement: Advertisement;
}

export function AdvertisementCard({ advertisement }: AdvertisementCardProps) {
  const whatsappLink = buildWhatsAppLink(
    advertisement.whatsappNumber,
    `Olá! Vi seu anúncio "${advertisement.title}" no BuscaZapp e gostaria de mais informações.`
  );

  const locationLabel = formatAdvertisementLocation({
    city: advertisement.location.city,
    neighborhood: advertisement.location.neighborhood,
  });
  const serviceAreaLabel = getServiceAreaLabel(advertisement.serviceArea);

  const hasReviews = advertisement.reviewCount > 0;

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
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

        <Link href={`/anuncio/${advertisement.id}`}>
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
            className="h-8 flex-1 px-2 text-xs font-semibold"
            asChild
          >
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contatar ${advertisement.title} via WhatsApp`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-[11px]"
            asChild
          >
            <Link href={`/anuncio/${advertisement.id}`}>Ver</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
