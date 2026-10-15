"use client";

import { useState, useTransition } from "react";
import { Ticket } from "lucide-react";
import type { PublicCouponCard } from "@/application/services/public-coupons-service";
import { claimCouponAction } from "@/actions/coupon-actions";
import { Button } from "@/components/ui/button";
import { ClaimedCouponDialog } from "@/features/dashboard/components/claimed-coupon-dialog";

interface CouponCardProps {
  readonly coupon: PublicCouponCard;
}

function formatValidUntil(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

export function CouponCard({ coupon }: CouponCardProps) {
  const [remaining, setRemaining] = useState(coupon.quantityRemaining);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<Awaited<
    ReturnType<typeof claimCouponAction>
  > | null>(null);
  const [pending, startTransition] = useTransition();
  const validUntil = formatValidUntil(coupon.endsAt);
  const soldOut = remaining <= 0;

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await claimCouponAction(coupon.id);
        setClaimed(result);
        setRemaining(result.quantityRemaining);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Não foi possível gerar o cupom"
        );
      }
    });
  }

  return (
    <>
      <article className="flex h-full flex-col rounded-xl border border-dashed border-emerald-300/80 bg-card p-3.5 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <p className="truncate text-[11px] font-medium text-emerald-700">
              {coupon.businessName}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            {coupon.badgeLabel}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
            {coupon.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {coupon.description}
          </p>
          {validUntil ? (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Válido até {validUntil}
            </p>
          ) : null}
          <p className="mt-1 text-[10px] font-medium text-emerald-700">
            {soldOut
              ? "Esgotado"
              : `${remaining} ${remaining === 1 ? "restante" : "restantes"}`}
          </p>
          {error ? (
            <p className="mt-1 text-[10px] text-destructive">{error}</p>
          ) : null}
        </div>

        <Button
          type="button"
          size="sm"
          className="mt-3 h-8 w-full shrink-0 bg-emerald-600 text-[11px] font-semibold text-white hover:bg-emerald-700"
          disabled={soldOut || pending}
          onClick={handleClaim}
        >
          {pending ? "Gerando…" : soldOut ? "Esgotado" : "Pegar cupom"}
        </Button>
      </article>

      {claimed ? (
        <ClaimedCouponDialog
          claimed={claimed}
          onClose={() => setClaimed(null)}
        />
      ) : null}
    </>
  );
}
