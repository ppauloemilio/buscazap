import { randomBytes } from "crypto";
import { PRICING } from "@/config/pricing";
import { AdvertisementStatus, UserRole } from "@/domain/enums";
import { prisma } from "@/lib/prisma";

const REFERRAL_BONUS_SOURCE = "REFERRAL_BONUS";
const ADS_PER_CREDIT = PRICING.REFERRAL_PUBLISHED_ADS_PER_CREDIT;

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

export async function countPublishedAdsFromReferrals(
  referrerId: string
): Promise<number> {
  return prisma.advertisement.count({
    where: {
      status: AdvertisementStatus.APPROVED,
      provider: {
        OR: [
          { referredById: referrerId },
          { referralReceived: { is: { referrerId } } },
        ],
      },
    },
  });
}

/**
 * Recalcula créditos grátis: floor(anúncios aprovados dos indicados / N)
 * menos créditos já resgatados (PremiumBoost REFERRAL_BONUS).
 */
export async function syncReferralPremiumCredits(referrerId: string) {
  const [publishedAdsCount, redeemedCredits] = await Promise.all([
    countPublishedAdsFromReferrals(referrerId),
    prisma.premiumBoost.count({
      where: {
        providerId: referrerId,
        source: REFERRAL_BONUS_SOURCE,
      },
    }),
  ]);

  const earnedCredits = Math.floor(publishedAdsCount / ADS_PER_CREDIT);
  const freePremiumCredits = Math.max(0, earnedCredits - redeemedCredits);

  await prisma.provider.update({
    where: { id: referrerId },
    data: { freePremiumCredits },
  });

  return {
    publishedAdsCount,
    earnedCredits,
    redeemedCredits,
    freePremiumCredits,
  };
}

/** Se o anunciante foi indicado, sincroniza os créditos do indicador. */
export async function syncReferralCreditsForProvider(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      referredById: true,
      referralReceived: { select: { referrerId: true } },
    },
  });

  const referrerId =
    provider?.referredById ?? provider?.referralReceived?.referrerId ?? null;

  if (!referrerId) {
    return null;
  }

  return syncReferralPremiumCredits(referrerId);
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

    // Crédito só é concedido quando indicados publicam anúncios (APPROVED).
    return { applied: true as const, creditGranted: false as const };
  });
}

function creditProgress(publishedAdsCount: number) {
  const progressInCycle = publishedAdsCount % ADS_PER_CREDIT;
  const remainingForCredit =
    progressInCycle === 0
      ? ADS_PER_CREDIT
      : ADS_PER_CREDIT - progressInCycle;

  return {
    publishedAdsCount,
    adsPerCredit: ADS_PER_CREDIT,
    remainingForCredit,
    progressInCycle:
      progressInCycle === 0 && publishedAdsCount > 0 ? 0 : progressInCycle,
  };
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

  const synced = await syncReferralPremiumCredits(providerId);

  const referrals = await prisma.referral.findMany({
    where: { referrerId: providerId },
    orderBy: { createdAt: "desc" },
    include: {
      referred: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          advertisements: {
            where: { status: AdvertisementStatus.APPROVED },
            select: { id: true },
          },
        },
      },
    },
  });

  const progress = creditProgress(synced.publishedAdsCount);

  return {
    referralCode: provider.referralCode,
    freePremiumCredits: synced.freePremiumCredits,
    referralCount: referrals.length,
    publishedAdsCount: synced.publishedAdsCount,
    referralsPerCredit: ADS_PER_CREDIT,
    adsPerCredit: ADS_PER_CREDIT,
    remainingForCredit: progress.remainingForCredit,
    progressInCycle: progress.progressInCycle,
    referralPremiumDays: PRICING.REFERRAL_PREMIUM_DAYS,
    paidPremiumDays: PRICING.PREMIUM_BOOST_DAYS,
    referrals: referrals.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      referredName: item.referred.name,
      referredEmail: item.referred.email,
      publishedAdsCount: item.referred.advertisements.length,
    })),
  };
}

export async function listAdminReferrers(filters?: {
  readonly createdSince?: Date;
}) {
  const referrers = await prisma.provider.findMany({
    where: {
      role: UserRole.PROVIDER,
      referralsMade: filters?.createdSince
        ? { some: { createdAt: { gte: filters.createdSince } } }
        : { some: {} },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      referralCode: true,
      freePremiumCredits: true,
      createdAt: true,
      referralsMade: {
        where: filters?.createdSince
          ? { createdAt: { gte: filters.createdSince } }
          : undefined,
        select: { id: true },
      },
    },
  });

  const withCounts = await Promise.all(
    referrers.map(async (provider) => {
      const synced = await syncReferralPremiumCredits(provider.id);
      return {
        id: provider.id,
        name: provider.name,
        email: provider.email,
        whatsapp: provider.whatsapp,
        referralCode: provider.referralCode,
        freePremiumCredits: synced.freePremiumCredits,
        publishedAdsCount: synced.publishedAdsCount,
        createdAt: provider.createdAt,
        referralCount: provider.referralsMade.length,
      };
    })
  );

  return withCounts
    .filter((provider) => provider.referralCount > 0)
    .sort((a, b) => b.referralCount - a.referralCount);
}

export async function getAdminReferrerDetail(referrerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: referrerId },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      referralCode: true,
      freePremiumCredits: true,
      status: true,
      createdAt: true,
    },
  });

  if (!provider) {
    return null;
  }

  const synced = await syncReferralPremiumCredits(referrerId);
  const progress = creditProgress(synced.publishedAdsCount);

  const referrals = await prisma.referral.findMany({
    where: { referrerId },
    orderBy: { createdAt: "desc" },
    include: {
      referred: {
        select: {
          id: true,
          name: true,
          email: true,
          whatsapp: true,
          status: true,
          createdAt: true,
          advertisements: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              status: true,
              category: true,
              city: true,
              state: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  return {
    ...provider,
    freePremiumCredits: synced.freePremiumCredits,
    publishedAdsCount: synced.publishedAdsCount,
    adsPerCredit: ADS_PER_CREDIT,
    remainingForCredit: progress.remainingForCredit,
    referralCount: referrals.length,
    referrals: referrals.map((referral) => ({
      id: referral.id,
      createdAt: referral.createdAt,
      referred: {
        id: referral.referred.id,
        name: referral.referred.name,
        email: referral.referred.email,
        whatsapp: referral.referred.whatsapp,
        status: referral.referred.status,
        createdAt: referral.referred.createdAt,
        advertisements: referral.referred.advertisements,
        publishedAdsCount: referral.referred.advertisements.filter(
          (ad) => ad.status === AdvertisementStatus.APPROVED
        ).length,
      },
    })),
  };
}
