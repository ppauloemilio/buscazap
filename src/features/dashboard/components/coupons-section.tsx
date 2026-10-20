import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import type { PublicCouponCard } from "@/application/services/public-coupons-service";
import { HOME_COUPONS_LIMIT } from "@/application/services/public-coupons-service";
import { CouponCard } from "@/features/dashboard/components/coupon-card";

interface CouponsSectionProps {
  readonly coupons: readonly PublicCouponCard[];
  readonly total: number;
  readonly viewAllHref?: string;
  readonly showAll?: boolean;
  readonly hideHeader?: boolean;
  /** Mostra a seção mesmo sem cupons (home com flag ligada). */
  readonly showWhenEmpty?: boolean;
}

export function CouponsSection({
  coupons,
  total,
  viewAllHref = "/cupons",
  showAll = false,
  hideHeader = false,
  showWhenEmpty = false,
}: CouponsSectionProps) {
  if (coupons.length === 0 && !showWhenEmpty) {
    return null;
  }

  const showViewAll = !showAll && total > HOME_COUPONS_LIMIT;

  return (
    <section className="py-4 md:py-5">
      <div className="container mx-auto px-4">
        {!hideHeader && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <Ticket className="h-5 w-5 shrink-0 text-emerald-600" />
                Cupons de desconto
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Resgate cupons e economize nas suas empresas favoritas.
              </p>
            </div>
            {(showViewAll || coupons.length === 0) && (
              <Link
                href={viewAllHref}
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-whatsapp hover:underline"
              >
                {coupons.length === 0 ? "Ver página" : "Ver todos"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}

        {coupons.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum cupom ativo no momento. Cupons vêm de anunciantes Plano Pro
            (ativos, com estoque e dentro da validade).
          </p>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {coupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
