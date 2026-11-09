"use client";

import { useEffect } from "react";

/** Grava cupom da URL em sessionStorage para o checkout da assinatura. */
export function PersistBillingCoupon({ code }: { readonly code?: string }) {
  useEffect(() => {
    const normalized = code?.trim().toUpperCase();
    if (!normalized) return;
    try {
      sessionStorage.setItem("buscazapp_billing_coupon", normalized);
    } catch {
      /* ignore */
    }
  }, [code]);

  return null;
}
