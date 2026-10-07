import type { Advertisement } from "@/domain/entities";

export interface SplitAdvertisements {
  readonly premium: readonly Advertisement[];
  readonly regular: readonly Advertisement[];
}

export interface SplitByPlan {
  readonly paid: readonly Advertisement[];
  readonly free: readonly Advertisement[];
}

export function splitAdvertisementsByPremium(
  advertisements: readonly Advertisement[]
): SplitAdvertisements {
  const premium: Advertisement[] = [];
  const regular: Advertisement[] = [];

  for (const advertisement of advertisements) {
    if (advertisement.isPremium) {
      premium.push(advertisement);
    } else {
      regular.push(advertisement);
    }
  }

  return { premium, regular };
}

/** Planos pagos (assinatura) primeiro; listagens grátis depois. */
export function splitAdvertisementsByPlan(
  advertisements: readonly Advertisement[]
): SplitByPlan {
  const paid: Advertisement[] = [];
  const free: Advertisement[] = [];

  for (const advertisement of advertisements) {
    if (advertisement.plan === "free") {
      free.push(advertisement);
    } else {
      paid.push(advertisement);
    }
  }

  return { paid, free };
}

export function sortPaidBeforeFree(
  advertisements: readonly Advertisement[]
): Advertisement[] {
  const { paid, free } = splitAdvertisementsByPlan(advertisements);
  return [...paid, ...free];
}
