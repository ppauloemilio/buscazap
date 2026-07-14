import { randomBytes } from "crypto";
import { PRICING } from "@/config/pricing";
import { prisma } from "@/lib/prisma";

export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    const existing = await prisma.provider.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }

  return randomBytes(6).toString("hex").toUpperCase();
}

export async function findReferrerByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  return prisma.provider.findUnique({
    where: { referralCode: normalized },
    select: {
      id: true,
      name: true,
      referralCode: true,
      role: true,
      status: true,
    },
  });
}

export async function applyReferralOnRegistration(input: {
  readonly referredId: string;
  readonly referralCode?: string;
}) {
  if (!input.referralCode?.trim()) {
    return { applied: false as const, creditGranted: false as const };
  }

  const referrer = await findReferrerByCode(input.referralCode);

  if (!referrer || referrer.id === input.referredId || referrer.status === "BLOCKED") {
    return { applied: false as const, creditGranted: false as const };
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.referral.findUnique({
      where: { referredId: input.referredId },
    });
    if (existing) {
      return { applied: false as const, creditGranted: false as const };
    }

    await tx.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: input.referredId,
      },
    });

    await tx.provider.update({
      where: { id: input.referredId },
      data: { referredById: referrer.id },
    });

    const referralCount = await tx.referral.count({
      where: { referrerId: referrer.id },
    });

    let creditGranted = false;
    if (referralCount > 0 && referralCount % PRICING.REFERRALS_PER_PREMIUM_CREDIT === 0) {
      await tx.provider.update({
        where: { id: referrer.id },
        data: { freePremiumCredits: { increment: 1 } },
      });
      creditGranted = true;
    }

    return { applied: true as const, creditGranted };
  });
}

export async function getReferralDashboard(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      referralCode: true,
      freePremiumCredits: true,
      name: true,
    },
  });

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: providerId },
    orderBy: { createdAt: "desc" },
    include: {
      referred: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
  });

  const referralCount = referrals.length;
  const progressInCycle = referralCount % PRICING.REFERRALS_PER_PREMIUM_CREDIT;
  const remainingForCredit =
    progressInCycle === 0
      ? PRICING.REFERRALS_PER_PREMIUM_CREDIT
      : PRICING.REFERRALS_PER_PREMIUM_CREDIT - progressInCycle;

  return {
    referralCode: provider.referralCode,
    freePremiumCredits: provider.freePremiumCredits,
    referralCount,
    referralsPerCredit: PRICING.REFERRALS_PER_PREMIUM_CREDIT,
    remainingForCredit,
    progressInCycle:
      progressInCycle === 0 && referralCount > 0 ? 0 : progressInCycle,
    referralPremiumDays: PRICING.REFERRAL_PREMIUM_DAYS,
    paidPremiumDays: PRICING.PREMIUM_BOOST_DAYS,
    referrals: referrals.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      referredName: item.referred.name,
      referredEmail: item.referred.email,
    })),
  };
}
