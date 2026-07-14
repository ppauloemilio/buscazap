import type { Prisma } from "@prisma/client";
import { PRICING } from "@/config/pricing";
import { prisma } from "@/lib/prisma";

const PREMIUM_SOURCE = {
  PAID: "PAID",
  REFERRAL_BONUS: "REFERRAL_BONUS",
  ADMIN: "ADMIN",
} as const;

function computePremiumExpiry(currentExpiresAt: Date | null, days: number, from = new Date()) {
  const baseDate =
    currentExpiresAt && currentExpiresAt.getTime() > from.getTime()
      ? currentExpiresAt
      : from;
  const expiresAt = new Date(baseDate);
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

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

  const expiresAt = computePremiumExpiry(
    advertisement.premiumExpiresAt,
    PRICING.PREMIUM_BOOST_DAYS,
    paidAt
  );

  await tx.premiumBoost.create({
    data: {
      advertisementId,
      providerId,
      paymentId,
      amount: PRICING.PREMIUM_BOOST_AMOUNT,
      source: PREMIUM_SOURCE.PAID,
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
    referralDurationDays: PRICING.REFERRAL_PREMIUM_DAYS,
  };
}

export async function grantAdminPremiumBoost(
  providerId: string,
  advertisementId: string
) {
  const advertisement = await prisma.advertisement.findFirst({
    where: { id: advertisementId, providerId },
  });

  if (!advertisement) {
    throw new Error("Anúncio não encontrado");
  }

  const startsAt = new Date();
  const expiresAt = computePremiumExpiry(
    advertisement.premiumExpiresAt,
    PRICING.PREMIUM_BOOST_DAYS,
    startsAt
  );

  await prisma.premiumBoost.create({
    data: {
      advertisementId,
      providerId,
      amount: 0,
      source: PREMIUM_SOURCE.ADMIN,
      startsAt,
      expiresAt,
    },
  });

  await prisma.advertisement.update({
    where: { id: advertisementId },
    data: {
      premiumExpiresAt: expiresAt,
      status: "APPROVED",
    },
  });

  return expiresAt;
}

export async function redeemReferralPremiumBoost(
  providerId: string,
  advertisementId: string
) {
  return prisma.$transaction(async (tx) => {
    const provider = await tx.provider.findUnique({
      where: { id: providerId },
      select: { freePremiumCredits: true, role: true },
    });

    if (!provider) {
      throw new Error("PROVIDER_NOT_FOUND");
    }

    if (provider.freePremiumCredits < 1) {
      throw new Error("Você não possui créditos de destaque grátis");
    }

    const advertisement = await tx.advertisement.findFirst({
      where: { id: advertisementId, providerId },
    });

    if (!advertisement) {
      throw new Error("Anúncio não encontrado");
    }

    if (
      advertisement.premiumExpiresAt &&
      advertisement.premiumExpiresAt.getTime() > Date.now()
    ) {
      throw new Error("Este anúncio já está em destaque");
    }

    const startsAt = new Date();
    const expiresAt = computePremiumExpiry(
      advertisement.premiumExpiresAt,
      PRICING.REFERRAL_PREMIUM_DAYS,
      startsAt
    );

    await tx.provider.update({
      where: { id: providerId },
      data: { freePremiumCredits: { decrement: 1 } },
    });

    await tx.premiumBoost.create({
      data: {
        advertisementId,
        providerId,
        amount: 0,
        source: PREMIUM_SOURCE.REFERRAL_BONUS,
        startsAt,
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

    return expiresAt;
  });
}
