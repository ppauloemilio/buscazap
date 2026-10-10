import type { Prisma } from "@prisma/client";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { PRICING } from "@/config/pricing";
import {
  ListingProfile,
  SUBSCRIPTION_TIER_REFERENCE,
  SubscriptionTier,
} from "@/domain/enums";
import { prisma } from "@/lib/prisma";
import { getProviderSubscriptionTier } from "@/lib/plus-plan";
import {
  canRenewSubscription,
  hasActiveSubscription,
  isAdminProvider,
} from "@/lib/provider-session";

export async function getSubscriptionStatus(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  const active = isAdminProvider(provider) || hasActiveSubscription(provider.subscriptionExpiresAt);
  const canRenew =
    !isAdminProvider(provider) &&
    canRenewSubscription(provider.subscriptionExpiresAt);

  return {
    active,
    canRenew,
    isAdmin: isAdminProvider(provider),
    isTrial: active && !isAdminProvider(provider) && provider.subscriptions.length === 0,
    expiresAt: provider.subscriptionExpiresAt,
    daysLeft: provider.subscriptionExpiresAt
      ? Math.max(
          0,
          Math.ceil(
            (provider.subscriptionExpiresAt.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null,
    lastSubscription: provider.subscriptions[0] ?? null,
    monthlyAmount: PRICING.SUBSCRIPTION_AMOUNT,
    plusMonthlyAmount: PRICING.SUBSCRIPTION_PLUS_AMOUNT,
    subscriptionTier: getProviderSubscriptionTier(provider),
    durationDays: PRICING.SUBSCRIPTION_DAYS,
    renewalWindowDays: PRICING.SUBSCRIPTION_RENEWAL_WINDOW_DAYS,
  };
}

export async function downgradeProviderToBasicTier(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { id: true, role: true, subscriptionExpiresAt: true },
  });

  if (!provider || isAdminProvider(provider)) {
    throw new Error("Não é possível alterar o plano desta conta");
  }

  await prisma.provider.update({
    where: { id: providerId },
    data: { subscriptionTier: SubscriptionTier.BASIC },
  });
}

function resolveTierFromPaymentReference(
  referenceId: string | null | undefined
): SubscriptionTier {
  if (referenceId === SUBSCRIPTION_TIER_REFERENCE.PLUS) {
    return SubscriptionTier.PLUS;
  }
  return SubscriptionTier.BASIC;
}

export async function activateSubscription(
  tx: Prisma.TransactionClient,
  providerId: string,
  paymentId: string,
  paidAt: Date
) {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    select: { amount: true, referenceId: true },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  const provider = await tx.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  const tier = resolveTierFromPaymentReference(payment.referenceId);

  const baseDate =
    provider.subscriptionExpiresAt &&
    provider.subscriptionExpiresAt.getTime() > paidAt.getTime()
      ? provider.subscriptionExpiresAt
      : paidAt;

  const expiresAt = new Date(baseDate);
  expiresAt.setDate(expiresAt.getDate() + PRICING.SUBSCRIPTION_DAYS);

  await tx.subscription.create({
    data: {
      providerId,
      paymentId,
      amount: payment.amount,
      startsAt: paidAt,
      expiresAt,
    },
  });

  await tx.provider.update({
    where: { id: providerId },
    data: {
      subscriptionExpiresAt: expiresAt,
      subscriptionTier: tier,
      listingProfile: ListingProfile.FULL,
    },
  });

  await tx.advertisement.updateMany({
    where: {
      providerId,
      status: "INACTIVE",
    },
    data: { status: "APPROVED" },
  });
}

export async function expireSubscriptions() {
  const now = new Date();

  // Freemium: anúncio vencido continua público como listagem básica.
  // Dados pagos permanecem no banco e voltam ao renovar.
  if (isNewAdProfileEnabled()) {
    const restored = await prisma.advertisement.updateMany({
      where: {
        status: "INACTIVE",
        provider: {
          role: { not: "ADMIN" },
          status: { not: "BLOCKED" },
        },
      },
      data: { status: "APPROVED" },
    });

    return restored.count;
  }

  const result = await prisma.advertisement.updateMany({
    where: {
      status: "APPROVED",
      provider: {
        role: { not: "ADMIN" },
        OR: [
          { subscriptionExpiresAt: null },
          { subscriptionExpiresAt: { lte: now } },
        ],
      },
    },
    data: { status: "INACTIVE" },
  });

  return result.count;
}
