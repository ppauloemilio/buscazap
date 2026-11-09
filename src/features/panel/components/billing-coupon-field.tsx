"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface BillingCouponFieldProps {
  readonly name?: string;
  readonly defaultCode?: string;
  readonly className?: string;
}

export function BillingCouponField({
  name = "couponCode",
  defaultCode = "",
  className,
}: BillingCouponFieldProps) {
  const [code, setCode] = useState(defaultCode);

  useEffect(() => {
    if (defaultCode) {
      setCode(defaultCode);
      return;
    }
    try {
      const fromQuery = new URLSearchParams(window.location.search).get(
        "coupon"
      );
      if (fromQuery) {
        setCode(fromQuery.trim().toUpperCase());
        return;
      }
      const stored = sessionStorage.getItem("buscazapp_billing_coupon");
      if (stored) setCode(stored);
    } catch {
      /* ignore */
    }
  }, [defaultCode]);

  return (
    <label className={className ?? "block space-y-1 text-sm"}>
      <span className="font-medium">Cupom de desconto (opcional)</span>
      <Input
        name={name}
        value={code}
        onChange={(event) => {
          const next = event.target.value.toUpperCase();
          setCode(next);
          try {
            if (next.trim()) {
              sessionStorage.setItem("buscazapp_billing_coupon", next.trim());
            } else {
              sessionStorage.removeItem("buscazapp_billing_coupon");
            }
          } catch {
            /* ignore */
          }
        }}
        placeholder="Ex.: BEMVINDO50"
        autoCapitalize="characters"
        className="uppercase"
      />
    </label>
  );
}
