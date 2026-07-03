import Link from "next/link";
import { Star, MapPin, MessageCircle, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdvertisementCover } from "@/components/advertisement/advertisement-cover";
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
    `Olá! Vi seu anúncio "${advertisement.title}" no BuscaZap e gostaria de mais informações.`
  );

  const locationLabel = advertisement.location.neighborhood
    ? `${advertisement.location.neighborhood}, ${advertisement.location.city}`
    : advertisement.location.city;

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <AdvertisementCover
          title={advertisement.title}
          category={advertisement.category}
        />
        {advertisement.isPremium && (
          <Badge variant="premium" className="absolute left-3 top-3 gap-1">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        )}
        <Badge
          variant="secondary"
          className="absolute right-3 top-3 bg-background/90"
        >
          {getAdvertisementTypeLabel(advertisement.type)}
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {advertisement.category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">
              {formatRating(advertisement.rating)}
            </span>
            <span>({advertisement.reviewCount})</span>
          </div>
        </div>

        <Link href={`/anuncio/${advertisement.id}`}>
          <h3 className="mb-1 line-clamp-1 text-base font-semibold text-foreground transition-colors hover:text-whatsapp">
            {advertisement.title}
          </h3>
        </Link>

        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {advertisement.description}
        </p>

        <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{locationLabel}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="whatsapp" size="sm" className="flex-1" asChild>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contatar ${advertisement.title} via WhatsApp`}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/anuncio/${advertisement.id}`}>Ver mais</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
