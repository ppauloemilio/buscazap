import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import type { PublicPromotionCard } from "@/application/services/public-promotions-service";
import { HOME_PROMOTIONS_LIMIT } from "@/application/services/public-promotions-service";
import { PromotionCard } from "@/features/dashboard/components/promotion-card";

interface PromotionsSectionProps {
  readonly promotions: readonly PublicPromotionCard[];
  readonly total: number;
  readonly viewAllHref?: string;
  /** Quando true, lista todos os itens (página /promocoes). */
  readonly showAll?: boolean;
  /** Oculta título da seção (ex.: página que já tem PageHeader). */
  readonly hideHeader?: boolean;
}

export function PromotionsSection({
  promotions,
  total,
  viewAllHref = "/promocoes",
  showAll = false,
  hideHeader = false,
}: PromotionsSectionProps) {
  if (promotions.length === 0) {
    return null;
  }

  const showViewAll = !showAll && total > HOME_PROMOTIONS_LIMIT;

  return (
    <section className="py-4 md:py-5">
      <div className="container mx-auto px-4">
        {!hideHeader && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <Tag className="h-5 w-5 shrink-0 text-rose-500" />
                Promoções
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ofertas ativas de anunciantes Plano Pro
              </p>
            </div>
            {showViewAll && (
              <Link
                href={viewAllHref}
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-whatsapp hover:underline"
              >
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {promotions.map((promotion) => (
            <PromotionCard key={promotion.id} promotion={promotion} />
          ))}
        </div>
      </div>
    </section>
  );
}
