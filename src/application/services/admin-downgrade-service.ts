import {
  PaymentStatus,
  PaymentType,
  SUBSCRIPTION_TIER_REFERENCE,
  SubscriptionTier,
  UserRole,
} from "@/domain/enums";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription, isPremiumActive } from "@/lib/provider-session";

export type DowngradeKind =
  | "PREMIUM_LOST"
  | "PRO_TO_BASIC"
  | "PRO_TO_FREE"
  | "BASIC_TO_FREE";

export type AdminDowngradeFilter =
  | "all"
  | "premium"
  | "pro-basico"
  | "pro-gratis"
  | "basico-gratis";

export type CurrentPlanLabel = "Grátis" | "Básico" | "Pro";

export type AdminDowngradeRow = {
  readonly providerId: string;
  readonly name: string;
  readonly email: string | null;
  readonly whatsapp: string;
  readonly location: string | null;
  readonly kinds: readonly DowngradeKind[];
  readonly currentPlan: CurrentPlanLabel;
  readonly premiumEndedAt: Date | null;
  readonly planChangedAt: Date | null;
  readonly lostPremiumTitles: readonly string[];
  readonly wasPro: boolean;
};

export const DOWNGRADE_KIND_LABELS: Record<DowngradeKind, string> = {
  PREMIUM_LOST: "Premium → sem destaque",
  PRO_TO_BASIC: "Pro → Básico",
  PRO_TO_FREE: "Pro → Grátis",
  BASIC_TO_FREE: "Básico → Grátis",
};

const FILTER_KIND: Record<
  Exclude<AdminDowngradeFilter, "all">,
  DowngradeKind
> = {
  premium: "PREMIUM_LOST",
  "pro-basico": "PRO_TO_BASIC",
  "pro-gratis": "PRO_TO_FREE",
  "basico-gratis": "BASIC_TO_FREE",
};

function isPlusReference(referenceId: string | null | undefined): boolean {
  return (
    referenceId === SUBSCRIPTION_TIER_REFERENCE.PLUS ||
    referenceId === SUBSCRIPTION_TIER_REFERENCE.PLUS_UPGRADE
  );
}

function paymentMoment(payment: {
  readonly paidAt: Date | null;
  readonly createdAt: Date;
}): Date {
  return payment.paidAt ?? payment.createdAt;
}

function currentPlan(input: {
  readonly subscriptionExpiresAt: Date | null;
  readonly subscriptionTier: string | null;
  readonly now: Date;
}): CurrentPlanLabel {
  if (!hasActiveSubscription(input.subscriptionExpiresAt)) {
    return "Grátis";
  }
  if (input.subscriptionTier === SubscriptionTier.PLUS) {
    return "Pro";
  }
  return "Básico";
}

export async function listAdminDowngrades(filter: AdminDowngradeFilter = "all"): Promise<{
  readonly rows: readonly AdminDowngradeRow[];
  readonly counts: Record<AdminDowngradeFilter, number>;
}> {
  const now = new Date();

  const providers = await prisma.provider.findMany({
    where: {
      role: { not: UserRole.ADMIN },
      OR: [
        { advertisements: { some: { premiumBoosts: { some: {} } } } },
        {
          payments: {
            some: {
              type: PaymentType.SUBSCRIPTION,
              status: PaymentStatus.PAID,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      city: true,
      state: true,
      subscriptionExpiresAt: true,
      subscriptionTier: true,
      advertisements: {
        select: {
          title: true,
          premiumExpiresAt: true,
          premiumBoosts: {
            select: { expiresAt: true },
            orderBy: { expiresAt: "desc" },
            take: 1,
          },
        },
      },
      payments: {
        where: {
          type: PaymentType.SUBSCRIPTION,
          status: PaymentStatus.PAID,
        },
        select: { referenceId: true, paidAt: true, createdAt: true },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  const rows: AdminDowngradeRow[] = [];

  for (const provider of providers) {
    const plan = currentPlan({
      subscriptionExpiresAt: provider.subscriptionExpiresAt,
      subscriptionTier: provider.subscriptionTier,
      now,
    });

    const paid = [...provider.payments].sort(
      (a, b) => paymentMoment(b).getTime() - paymentMoment(a).getTime()
    );
    const everPlus = paid.some((payment) => isPlusReference(payment.referenceId));
    const lastIsPlus =
      paid.length > 0 && isPlusReference(paid[0]?.referenceId);

    const kinds: DowngradeKind[] = [];
    let planChangedAt: Date | null = null;

    if (plan === "Básico" && everPlus) {
      kinds.push("PRO_TO_BASIC");
      const latestPlusAt = Math.max(
        ...paid
          .filter((payment) => isPlusReference(payment.referenceId))
          .map((payment) => paymentMoment(payment).getTime())
      );
      const basicAfterPlus = paid.find(
        (payment) =>
          !isPlusReference(payment.referenceId) &&
          paymentMoment(payment).getTime() >= latestPlusAt
      );
      planChangedAt = basicAfterPlus ? paymentMoment(basicAfterPlus) : null;
    } else if (plan === "Grátis" && paid.length > 0 && lastIsPlus) {
      kinds.push("PRO_TO_FREE");
      planChangedAt = provider.subscriptionExpiresAt;
    } else if (plan === "Grátis" && paid.length > 0) {
      kinds.push("BASIC_TO_FREE");
      planChangedAt = provider.subscriptionExpiresAt;
    }

    const lostPremiumTitles: string[] = [];
    let premiumEndedAt: Date | null = null;
    let hadPremium = false;
    let hasActivePremium = false;

    for (const ad of provider.advertisements) {
      const latestBoost = ad.premiumBoosts[0];
      const boostStillActive =
        latestBoost != null && latestBoost.expiresAt.getTime() > now.getTime();
      if (isPremiumActive(ad.premiumExpiresAt) || boostStillActive) {
        hasActivePremium = true;
      }
      if (!latestBoost) continue;
      hadPremium = true;
      if (
        !premiumEndedAt ||
        latestBoost.expiresAt.getTime() > premiumEndedAt.getTime()
      ) {
        premiumEndedAt = latestBoost.expiresAt;
      }
      if (!isPremiumActive(ad.premiumExpiresAt) && !boostStillActive) {
        lostPremiumTitles.push(ad.title);
      }
    }

    if (hadPremium && !hasActivePremium) {
      kinds.push("PREMIUM_LOST");
    } else {
      premiumEndedAt = null;
    }

    if (kinds.length === 0) continue;

    const location = [provider.city, provider.state].filter(Boolean).join(" / ");

    rows.push({
      providerId: provider.id,
      name: provider.name,
      email: provider.email,
      whatsapp: provider.whatsapp,
      location: location || null,
      kinds,
      currentPlan: plan,
      premiumEndedAt: kinds.includes("PREMIUM_LOST") ? premiumEndedAt : null,
      planChangedAt,
      lostPremiumTitles,
      wasPro: everPlus,
    });
  }

  rows.sort((a, b) => {
    const aTime = Math.max(
      a.premiumEndedAt?.getTime() ?? 0,
      a.planChangedAt?.getTime() ?? 0
    );
    const bTime = Math.max(
      b.premiumEndedAt?.getTime() ?? 0,
      b.planChangedAt?.getTime() ?? 0
    );
    return bTime - aTime;
  });

  const counts: Record<AdminDowngradeFilter, number> = {
    all: rows.length,
    premium: rows.filter((row) => row.kinds.includes("PREMIUM_LOST")).length,
    "pro-basico": rows.filter((row) => row.kinds.includes("PRO_TO_BASIC")).length,
    "pro-gratis": rows.filter((row) => row.kinds.includes("PRO_TO_FREE")).length,
    "basico-gratis": rows.filter((row) => row.kinds.includes("BASIC_TO_FREE"))
      .length,
  };

  const visible =
    filter === "all"
      ? rows
      : rows.filter((row) => row.kinds.includes(FILTER_KIND[filter]));

  return { rows: visible, counts };
}
