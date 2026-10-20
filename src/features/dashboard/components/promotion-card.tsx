import Link from "next/link";
import { Tag } from "lucide-react";
import { formatPriceBRL } from "@/config/pricing";
import type { PublicPromotionCard } from "@/application/services/public-promotions-service";
import { AdvertisementCover } from "@/components/advertisement/advertisement-cover";
import { Button } from "@/components/ui/button";

interface PromotionCardProps {
  readonly promotion: PublicPromotionCard;
}

function formatValidUntil(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

export function PromotionCard({ promotion }: PromotionCardProps) {
  const validUntil = formatValidUntil(promotion.endsAt);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-muted">
        <AdvertisementCover
          title={promotion.title}
          category={promotion.businessName}
          imageUrl={promotion.imageUrl}
          compact
          fit="cover"
        />
        {promotion.discountPercent > 0 && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-600 shadow-sm">
            <Tag className="h-2.5 w-2.5" />
            {promotion.discountPercent}% OFF
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="truncate text-[10px] font-medium text-whatsapp">
            {promotion.businessName}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-foreground sm:text-sm">
            {promotion.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-1">
            <span className="text-[10px] text-muted-foreground line-through">
              {formatPriceBRL(promotion.priceOriginal)}
            </span>
            <span className="text-sm font-bold text-whatsapp">
              {formatPriceBRL(promotion.pricePromo)}
            </span>
          </div>

          {validUntil ? (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Até {validUntil}
            </p>
          ) : null}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-2 h-7 w-full shrink-0 text-[10px] font-semibold uppercase tracking-wide"
          asChild
        >
          <Link href={promotion.href}>Ver oferta</Link>
        </Button>
      </div>
    </article>
  );
}
