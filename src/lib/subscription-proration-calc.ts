import { PRICING } from "@/config/pricing";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function countSubscriptionDaysRemaining(
  subscriptionExpiresAt: Date,
  now = new Date()
): number {
  const msLeft = subscriptionExpiresAt.getTime() - now.getTime();
  if (msLeft <= 0) {
    return 0;
  }
  return Math.ceil(msLeft / MS_PER_DAY);
}

export function calculateProRataUpgradeAmount(
  subscriptionExpiresAt: Date,
  now = new Date()
): number {
  const daysLeft = countSubscriptionDaysRemaining(subscriptionExpiresAt, now);
  if (daysLeft <= 0) {
    return PRICING.SUBSCRIPTION_PLUS_AMOUNT;
  }

  const monthlyDiff =
    PRICING.SUBSCRIPTION_PLUS_AMOUNT - PRICING.SUBSCRIPTION_AMOUNT;
  const billableDays = Math.min(daysLeft, PRICING.SUBSCRIPTION_DAYS);
  const raw = (monthlyDiff * billableDays) / PRICING.SUBSCRIPTION_DAYS;
  const rounded = Math.round(raw * 100) / 100;

  return Math.max(0.01, rounded);
}
