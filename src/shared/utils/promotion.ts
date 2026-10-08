export function isPromotionPubliclyActive(
  promo: {
    readonly isEnabled: boolean;
    readonly startsAt: Date;
    readonly endsAt: Date;
  },
  now = new Date()
): boolean {
  if (!promo.isEnabled) return false;
  return (
    promo.startsAt.getTime() <= now.getTime() &&
    promo.endsAt.getTime() >= now.getTime()
  );
}
