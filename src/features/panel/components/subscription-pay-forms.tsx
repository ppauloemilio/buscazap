"use client";

import { useEffect, useState } from "react";
import {
  createSubscriptionPaymentAction,
  startRecurringSubscriptionAction,
} from "@/actions/provider-actions";
import { BillingCouponField } from "@/features/panel/components/billing-coupon-field";
import { SubscriptionTier } from "@/domain/enums";
import { Button } from "@/components/ui/button";

function useStoredCouponCode() {
  const [code, setCode] = useState("");

  useEffect(() => {
    function sync() {
      try {
        const fromQuery = new URLSearchParams(window.location.search).get(
          "coupon"
        );
        if (fromQuery) {
          setCode(fromQuery.trim().toUpperCase());
          return;
        }
        setCode(
          (sessionStorage.getItem("buscazapp_billing_coupon") ?? "").toUpperCase()
        );
      } catch {
        setCode("");
      }
    }
    sync();
    window.addEventListener("storage", sync);
    const id = window.setInterval(sync, 500);
    return () => {
      window.removeEventListener("storage", sync);
      window.clearInterval(id);
    };
  }, []);

  return code;
}

export function SubscriptionCouponBox({
  defaultCode = "",
}: {
  readonly defaultCode?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-sky-300/80 bg-sky-50/40 p-3">
      <BillingCouponField defaultCode={defaultCode} />
      <p className="mt-1 text-[11px] text-muted-foreground">
        O desconto é aplicado no valor do PIX ao confirmar o plano.
      </p>
    </div>
  );
}

export function SubscriptionPayButton({
  tier,
  label,
  variant = "whatsapp",
}: {
  readonly tier: SubscriptionTier;
  readonly label: string;
  readonly variant?: "whatsapp" | "outline";
}) {
  const couponCode = useStoredCouponCode();

  return (
    <form action={createSubscriptionPaymentAction}>
      <input type="hidden" name="tier" value={tier} />
      <input type="hidden" name="couponCode" value={couponCode} />
      <Button type="submit" variant={variant} size="sm" className="w-full sm:w-auto">
        {label}
      </Button>
    </form>
  );
}

export function RecurringSubscribeButton({
  tier,
  label,
}: {
  readonly tier: SubscriptionTier;
  readonly label: string;
}) {
  return (
    <form action={startRecurringSubscriptionAction}>
      <input type="hidden" name="tier" value={tier} />
      <Button type="submit" variant="outline" size="sm" className="w-full sm:w-auto">
        {label}
      </Button>
    </form>
  );
}
