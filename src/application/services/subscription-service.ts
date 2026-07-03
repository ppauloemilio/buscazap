import type { Prisma } from "@prisma/client";
import { PRICING } from "@/config/pricing";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/provider-session";

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

  const active = hasActiveSubscription(provider.subscriptionExpiresAt);

  return {
    active,
    expiresAt: provider.subscriptionExpiresAt,
    lastSubscription: provider.subscriptions[0] ?? null,
    monthlyAmount: PRICING.SUBSCRIPTION_AMOUNT,
    durationDays: PRICING.SUBSCRIPTION_DAYS,
  };
}

export async function activateSubscription(
  tx: Prisma.TransactionClient,
  providerId: string,
  paymentId: string,
  paidAt: Date
) {
  const provider = await tx.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

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
      amount: PRICING.SUBSCRIPTION_AMOUNT,
      startsAt: paidAt,
      expiresAt,
    },
  });

  await tx.provider.update({
    where: { id: providerId },
    data: { subscriptionExpiresAt: expiresAt },
  });
}

export async function expireSubscriptions() {
  const now = new Date();

  const expiredProviders = await prisma.provider.findMany({
    where: {
      subscriptionExpiresAt: { lt: now },
    },
  });

  for (const provider of expiredProviders) {
    await prisma.provider.update({
      where: { id: provider.id },
      data: { subscriptionExpiresAt: null },
    });

    await prisma.advertisement.updateMany({
      where: { providerId: provider.id, status: "APPROVED" },
      data: { status: "INACTIVE" },
    });
  }

  return expiredProviders.length;
}
