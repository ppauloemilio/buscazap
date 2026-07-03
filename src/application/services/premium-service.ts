import type { Prisma } from "@prisma/client";
import { PRICING } from "@/config/pricing";
import { prisma } from "@/lib/prisma";

export async function activatePremiumBoost(
  tx: Prisma.TransactionClient,
  providerId: string,
  advertisementId: string,
  paymentId: string,
  paidAt: Date
) {
  const advertisement = await tx.advertisement.findFirst({
    where: { id: advertisementId, providerId },
  });

  if (!advertisement) {
    throw new Error("ADVERTISEMENT_NOT_FOUND");
  }

  const baseDate =
    advertisement.premiumExpiresAt &&
    advertisement.premiumExpiresAt.getTime() > paidAt.getTime()
      ? advertisement.premiumExpiresAt
      : paidAt;

  const expiresAt = new Date(baseDate);
  expiresAt.setDate(expiresAt.getDate() + PRICING.PREMIUM_BOOST_DAYS);

  await tx.premiumBoost.create({
    data: {
      advertisementId,
      providerId,
      paymentId,
      amount: PRICING.PREMIUM_BOOST_AMOUNT,
      startsAt: paidAt,
      expiresAt,
    },
  });

  await tx.advertisement.update({
    where: { id: advertisementId },
    data: {
      premiumExpiresAt: expiresAt,
      status: "APPROVED",
    },
  });
}

export async function expirePremiumBoosts() {
  const now = new Date();

  const result = await prisma.advertisement.updateMany({
    where: {
      premiumExpiresAt: { lt: now },
    },
    data: {
      premiumExpiresAt: null,
    },
  });

  return result.count;
}

export function getPremiumBoostPricing() {
  return {
    amount: PRICING.PREMIUM_BOOST_AMOUNT,
    durationDays: PRICING.PREMIUM_BOOST_DAYS,
  };
}
