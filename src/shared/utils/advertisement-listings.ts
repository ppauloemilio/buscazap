import type { Advertisement } from "@/domain/entities";

export interface SplitAdvertisements {
  readonly premium: readonly Advertisement[];
  readonly regular: readonly Advertisement[];
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
