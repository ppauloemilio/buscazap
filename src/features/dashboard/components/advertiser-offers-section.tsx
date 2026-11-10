import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Ticket className="h-5 w-5 shrink-0 text-sky-700" />
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cupons de desconto na mensalidade e planos do BuscaZapp
          </p>
        </div>
        {showViewAll && (
          <Link
            href="/ofertas-anunciantes"
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-whatsapp hover:underline"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {coupons.map((coupon) => (
          <article
            key={coupon.id}
            className="flex h-full flex-col overflow-hidden rounded-xl border border-dashed border-sky-400/70 bg-sky-50/50"
          >
            <div className="flex min-h-0 flex-1 flex-col p-3.5 pb-3">
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

              <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                {coupon.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {coupon.description}
              </p>
              <p className="mt-2 font-mono text-[11px] font-semibold tracking-wide text-sky-900">
                {coupon.code}
              </p>
              <p className="mt-1 text-[10px] font-medium text-sky-900">
                Restam {coupon.quantityRemaining} de {coupon.quantityTotal}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {coupon.citiesLabel} · válido até{" "}
                {new Date(coupon.endsAt).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <div className="border-t border-dashed border-sky-300/70 px-3.5 py-3">
              <Button
                variant="whatsapp"
                size="sm"
                className="h-8 w-full shrink-0 text-[11px] font-semibold"
                asChild
              >
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
