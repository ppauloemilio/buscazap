import Link from "next/link";
import { Ticket } from "lucide-react";
import type { PublicBillingCouponCard } from "@/application/services/billing-coupon-service";
import { Button } from "@/components/ui/button";

interface AdvertiserOffersSectionProps {
  readonly coupons: readonly PublicBillingCouponCard[];
  readonly title?: string;
  readonly showViewAll?: boolean;
}

export function AdvertiserOffersSection({
  coupons,
  title = "Ofertas para anunciantes",
  showViewAll = true,
}: AdvertiserOffersSectionProps) {
  if (coupons.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Cupons de desconto na mensalidade e planos do BuscaZapp
          </p>
        </div>
        {showViewAll && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/ofertas-anunciantes">Ver todos</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => (
          <article
            key={coupon.id}
            className="flex flex-col rounded-xl border border-dashed border-sky-400/70 bg-sky-50/50 p-3.5"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 shrink-0 text-sky-700" />
                <p className="truncate text-[11px] font-medium text-sky-800">
                  {coupon.targetLabel}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-sky-300/80 bg-sky-100/80 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
                {coupon.badgeLabel || coupon.discountLabel}
              </span>
            </div>
            <h3 className="text-sm font-bold leading-snug">{coupon.title}</h3>
            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
              {coupon.description}
            </p>
            <p className="mt-2 font-mono text-sm font-semibold tracking-wide text-sky-900">
              {coupon.code}
            </p>
            <p className="mt-1 text-[10px] font-medium text-sky-900">
              Restam {coupon.quantityRemaining} de {coupon.quantityTotal}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {coupon.citiesLabel} · válido até{" "}
              {new Date(coupon.endsAt).toLocaleDateString("pt-BR")}
            </p>
            <div className="mt-3 border-t border-dashed border-sky-300/70 pt-3">
              <Button variant="whatsapp" size="sm" className="w-full text-[11px]" asChild>
                <Link
                  href={`/cadastro?coupon=${encodeURIComponent(coupon.code)}`}
                >
                  Usar cupom e anunciar
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
