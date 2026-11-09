import { Prisma } from "@prisma/client";
import {
  BillingCouponRedemptionStatus,
  BillingCouponTarget,
  BillingDiscountKind,
  SubscriptionTier,
} from "@/domain/enums";
import { prisma } from "@/lib/prisma";
import { markDataFetchDynamic } from "@/lib/db";

export const BILLING_COUPON_TARGET_LABELS: Record<BillingCouponTarget, string> =
  {
    [BillingCouponTarget.SUBSCRIPTION_BASIC]: "Mensalidade Plano Básico",
    [BillingCouponTarget.SUBSCRIPTION_PLUS]: "Mensalidade Plano Pro",
    [BillingCouponTarget.EXTRA_AD]: "Anúncio extra",
    [BillingCouponTarget.EXTRA_WHATSAPP]: "WhatsApp extra",
    [BillingCouponTarget.PREMIUM_BOOST]: "Destaque premium",
  };

export const BILLING_DISCOUNT_KIND_LABELS: Record<BillingDiscountKind, string> =
  {
    [BillingDiscountKind.PERCENT]: "Percentual (%)",
    [BillingDiscountKind.FIXED]: "Valor fixo (R$)",
    [BillingDiscountKind.FREE]: "Grátis (100% off)",
  };

export type BillingCouponRecord = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly targetFeature: BillingCouponTarget;
  readonly discountKind: BillingDiscountKind;
  readonly discountValue: number;
  readonly quantityTotal: number;
  readonly quantityRemaining: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly isEnabled: boolean;
  readonly isPublic: boolean;
  readonly cities: readonly string[];
  readonly onePerProvider: boolean;
};

export type PublicBillingCouponCard = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly targetFeature: BillingCouponTarget;
  readonly targetLabel: string;
  readonly discountLabel: string;
  readonly quantityTotal: number;
  readonly quantityRemaining: number;
  readonly endsAt: string;
  readonly citiesLabel: string;
};

function parseCitiesJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function isBillingCouponTarget(value: string): value is BillingCouponTarget {
  return (Object.values(BillingCouponTarget) as string[]).includes(value);
}

function isBillingDiscountKind(value: string): value is BillingDiscountKind {
  return (Object.values(BillingDiscountKind) as string[]).includes(value);
}

function mapCoupon(row: {
  id: string;
  code: string;
  title: string;
  description: string;
  badgeLabel: string;
  targetFeature: string;
  discountKind: string;
  discountValue: number;
  quantityTotal: number;
  quantityRemaining: number;
  startsAt: Date;
  endsAt: Date;
  isEnabled: boolean;
  isPublic: boolean;
  citiesJson: string;
  onePerProvider: boolean;
}): BillingCouponRecord {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    badgeLabel: row.badgeLabel,
    targetFeature: isBillingCouponTarget(row.targetFeature)
      ? row.targetFeature
      : BillingCouponTarget.SUBSCRIPTION_BASIC,
    discountKind: isBillingDiscountKind(row.discountKind)
      ? row.discountKind
      : BillingDiscountKind.PERCENT,
    discountValue: row.discountValue,
    quantityTotal: row.quantityTotal,
    quantityRemaining: row.quantityRemaining,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    isEnabled: row.isEnabled,
    isPublic: row.isPublic,
    cities: parseCitiesJson(row.citiesJson),
    onePerProvider: row.onePerProvider,
  };
}

export function formatBillingDiscountLabel(
  kind: BillingDiscountKind,
  value: number
): string {
  if (kind === BillingDiscountKind.FREE) return "Grátis";
  if (kind === BillingDiscountKind.PERCENT) {
    return `${Math.round(value)}% OFF`;
  }
  return `R$ ${value.toFixed(2).replace(".", ",")} OFF`;
}

export function applyBillingDiscount(
  amount: number,
  kind: BillingDiscountKind,
  value: number
): number {
  if (amount <= 0) return 0;
  if (kind === BillingDiscountKind.FREE) return 0;

  let next = amount;
  if (kind === BillingDiscountKind.PERCENT) {
    const pct = Math.min(100, Math.max(0, value));
    next = amount * (1 - pct / 100);
  } else if (kind === BillingDiscountKind.FIXED) {
    next = amount - Math.max(0, value);
  }

  const rounded = Math.round(Math.max(0, next) * 100) / 100;
  return rounded;
}

export function resolveTargetForSubscriptionTier(
  tier: SubscriptionTier
): BillingCouponTarget {
  return tier === SubscriptionTier.PLUS
    ? BillingCouponTarget.SUBSCRIPTION_PLUS
    : BillingCouponTarget.SUBSCRIPTION_BASIC;
}

function cityAllowed(
  cities: readonly string[],
  providerCity: string | null | undefined
): boolean {
  if (cities.length === 0) return true;
  const normalized = (providerCity ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return cities.some((city) => city.trim().toLowerCase() === normalized);
}

export async function expireBillingCoupons() {
  const now = new Date();
  await prisma.billingCoupon.updateMany({
    where: {
      isEnabled: true,
      endsAt: { lt: now },
    },
    data: { isEnabled: false },
  });
}

export async function listBillingCouponsForAdmin(): Promise<
  readonly BillingCouponRecord[]
> {
  markDataFetchDynamic();
  await expireBillingCoupons();

  const rows = await prisma.billingCoupon.findMany({
    orderBy: [{ isEnabled: "desc" }, { createdAt: "desc" }],
  });

  return rows.map(mapCoupon);
}

export async function listPublicBillingCoupons(options?: {
  readonly city?: string | null;
}): Promise<readonly PublicBillingCouponCard[]> {
  markDataFetchDynamic();
  await expireBillingCoupons();

  const now = new Date();
  const rows = await prisma.billingCoupon.findMany({
    where: {
      isEnabled: true,
      isPublic: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      quantityRemaining: { gt: 0 },
    },
    orderBy: { endsAt: "asc" },
    take: 50,
  });

  const mapped = rows.map(mapCoupon);
  const filtered = options?.city
    ? mapped.filter((coupon) => cityAllowed(coupon.cities, options.city))
    : mapped;

  return filtered.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    title: coupon.title,
    description: coupon.description,
    badgeLabel: coupon.badgeLabel,
    targetFeature: coupon.targetFeature,
    targetLabel: BILLING_COUPON_TARGET_LABELS[coupon.targetFeature],
    discountLabel: formatBillingDiscountLabel(
      coupon.discountKind,
      coupon.discountValue
    ),
    quantityTotal: coupon.quantityTotal,
    quantityRemaining: coupon.quantityRemaining,
    endsAt: coupon.endsAt.toISOString(),
    citiesLabel:
      coupon.cities.length === 0
        ? "Todas as cidades"
        : coupon.cities.join(", "),
  }));
}

function validateCouponInput(input: {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly targetFeature: BillingCouponTarget;
  readonly discountKind: BillingDiscountKind;
  readonly discountValue: number;
  readonly quantityTotal: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
}) {
  if (!input.code || input.code.length < 3) {
    throw new Error("Código do cupom deve ter ao menos 3 caracteres");
  }
  if (!input.title.trim() || !input.description.trim() || !input.badgeLabel.trim()) {
    throw new Error("Preencha título, descrição e selo");
  }
  if (input.quantityTotal < 1 || input.quantityTotal > 100000) {
    throw new Error("Quantidade deve ser entre 1 e 100000");
  }
  if (input.endsAt.getTime() <= input.startsAt.getTime()) {
    throw new Error("Data final deve ser após a data inicial");
  }
  if (input.discountKind === BillingDiscountKind.PERCENT) {
    if (input.discountValue <= 0 || input.discountValue > 100) {
      throw new Error("Percentual deve ser entre 1 e 100");
    }
  }
  if (input.discountKind === BillingDiscountKind.FIXED) {
    if (input.discountValue <= 0) {
      throw new Error("Informe um valor de desconto em R$ maior que zero");
    }
  }
}

export async function upsertBillingCoupon(input: {
  readonly couponId?: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly targetFeature: BillingCouponTarget;
  readonly discountKind: BillingDiscountKind;
  readonly discountValue: number;
  readonly quantityTotal: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly isPublic: boolean;
  readonly cities: readonly string[];
  readonly onePerProvider: boolean;
  readonly isEnabled?: boolean;
}) {
  const code = normalizeCode(input.code);
  const discountValue =
    input.discountKind === BillingDiscountKind.FREE
      ? 0
      : Math.round(input.discountValue * 100) / 100;

  validateCouponInput({
    ...input,
    code,
    discountValue,
  });

  const citiesJson = JSON.stringify(
    [...new Set(input.cities.map((c) => c.trim()).filter(Boolean))]
  );

  const base = {
    code,
    title: input.title.trim(),
    description: input.description.trim(),
    badgeLabel: input.badgeLabel.trim(),
    targetFeature: input.targetFeature,
    discountKind: input.discountKind,
    discountValue,
    quantityTotal: input.quantityTotal,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    isPublic: input.isPublic,
    citiesJson,
    onePerProvider: input.onePerProvider,
  };

  if (input.couponId) {
    const existing = await prisma.billingCoupon.findUnique({
      where: { id: input.couponId },
    });
    if (!existing) throw new Error("Cupom não encontrado");

    const used = existing.quantityTotal - existing.quantityRemaining;
    const nextRemaining = Math.max(0, input.quantityTotal - used);
    const now = new Date();
    const isEnabled =
      input.isEnabled ??
      (input.endsAt.getTime() >= now.getTime() ? existing.isEnabled : false);

    return prisma.billingCoupon.update({
      where: { id: existing.id },
      data: {
        ...base,
        quantityRemaining: nextRemaining,
        isEnabled,
      },
    });
  }

  return prisma.billingCoupon.create({
    data: {
      ...base,
      quantityRemaining: input.quantityTotal,
      isEnabled: input.isEnabled ?? true,
    },
  });
}

export async function setBillingCouponEnabled(input: {
  readonly couponId: string;
  readonly enabled: boolean;
}) {
  const existing = await prisma.billingCoupon.findUnique({
    where: { id: input.couponId },
  });
  if (!existing) throw new Error("Cupom não encontrado");

  if (input.enabled && existing.endsAt.getTime() < Date.now()) {
    throw new Error("Não é possível reativar um cupom expirado. Edite as datas.");
  }

  return prisma.billingCoupon.update({
    where: { id: existing.id },
    data: { isEnabled: input.enabled },
  });
}

export async function deleteBillingCoupon(couponId: string) {
  await prisma.billingCoupon.deleteMany({ where: { id: couponId } });
}

export type AppliedBillingCoupon = {
  readonly couponId: string;
  readonly code: string;
  readonly discountKind: BillingDiscountKind;
  readonly discountValue: number;
  readonly amountOriginal: number;
  readonly amountFinal: number;
};

/** Valida cupom sem alterar estoque (pré-check no checkout). */
export async function previewBillingCoupon(input: {
  readonly code: string;
  readonly providerId: string;
  readonly providerCity: string | null | undefined;
  readonly targetFeature: BillingCouponTarget;
  readonly amountOriginal: number;
}): Promise<AppliedBillingCoupon> {
  await expireBillingCoupons();
  const now = new Date();
  const code = normalizeCode(input.code);

  const coupon = await prisma.billingCoupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isEnabled) {
    throw new Error("Cupom inválido ou inativo");
  }
  if (coupon.startsAt.getTime() > now.getTime()) {
    throw new Error("Cupom ainda não está válido");
  }
  if (coupon.endsAt.getTime() < now.getTime()) {
    throw new Error("Cupom expirado");
  }
  if (!isBillingCouponTarget(coupon.targetFeature)) {
    throw new Error("Cupom com funcionalidade inválida");
  }
  if (coupon.targetFeature !== input.targetFeature) {
    throw new Error(
      `Este cupom é válido para ${BILLING_COUPON_TARGET_LABELS[coupon.targetFeature]}, não para esta cobrança`
    );
  }
  if (coupon.quantityRemaining <= 0) {
    throw new Error("Cupom esgotado");
  }

  const cities = parseCitiesJson(coupon.citiesJson);
  if (!cityAllowed(cities, input.providerCity)) {
    throw new Error("Cupom não válido para a cidade da sua conta");
  }

  if (coupon.onePerProvider) {
    const prior = await prisma.billingCouponRedemption.findFirst({
      where: {
        couponId: coupon.id,
        providerId: input.providerId,
        status: {
          in: [
            BillingCouponRedemptionStatus.RESERVED,
            BillingCouponRedemptionStatus.CONSUMED,
          ],
        },
      },
    });
    if (prior) {
      throw new Error("Você já utilizou este cupom");
    }
  }

  const kind = isBillingDiscountKind(coupon.discountKind)
    ? coupon.discountKind
    : BillingDiscountKind.PERCENT;

  return {
    couponId: coupon.id,
    code: coupon.code,
    discountKind: kind,
    discountValue: coupon.discountValue,
    amountOriginal: input.amountOriginal,
    amountFinal: applyBillingDiscount(
      input.amountOriginal,
      kind,
      coupon.discountValue
    ),
  };
}

/**
 * Reserva 1 uso + cria redemption ligado ao payment (na mesma transação do create).
 */
export async function reserveBillingCouponWithPayment(input: {
  readonly couponId: string;
  readonly providerId: string;
  readonly paymentId: string;
  readonly providerCity: string | null | undefined;
  readonly targetFeature: BillingCouponTarget;
  readonly amountOriginal: number;
  readonly tx: Prisma.TransactionClient;
}): Promise<AppliedBillingCoupon> {
  const now = new Date();
  const coupon = await input.tx.billingCoupon.findUnique({
    where: { id: input.couponId },
  });
  if (!coupon || !coupon.isEnabled) {
    throw new Error("Cupom inválido ou inativo");
  }
  if (
    coupon.startsAt.getTime() > now.getTime() ||
    coupon.endsAt.getTime() < now.getTime()
  ) {
    throw new Error("Cupom fora da validade");
  }
  if (coupon.targetFeature !== input.targetFeature) {
    throw new Error("Cupom não válido para esta cobrança");
  }

  const cities = parseCitiesJson(coupon.citiesJson);
  if (!cityAllowed(cities, input.providerCity)) {
    throw new Error("Cupom não válido para a cidade da sua conta");
  }

  if (coupon.onePerProvider) {
    const prior = await input.tx.billingCouponRedemption.findFirst({
      where: {
        couponId: coupon.id,
        providerId: input.providerId,
        status: {
          in: [
            BillingCouponRedemptionStatus.RESERVED,
            BillingCouponRedemptionStatus.CONSUMED,
          ],
        },
      },
    });
    if (prior) {
      throw new Error("Você já utilizou este cupom");
    }
  }

  const updated = await input.tx.billingCoupon.updateMany({
    where: {
      id: coupon.id,
      isEnabled: true,
      quantityRemaining: { gt: 0 },
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    data: { quantityRemaining: { decrement: 1 } },
  });
  if (updated.count === 0) {
    throw new Error("Cupom esgotado");
  }

  await input.tx.billingCouponRedemption.create({
    data: {
      couponId: coupon.id,
      providerId: input.providerId,
      paymentId: input.paymentId,
      status: BillingCouponRedemptionStatus.RESERVED,
    },
  });

  const kind = isBillingDiscountKind(coupon.discountKind)
    ? coupon.discountKind
    : BillingDiscountKind.PERCENT;

  return {
    couponId: coupon.id,
    code: coupon.code,
    discountKind: kind,
    discountValue: coupon.discountValue,
    amountOriginal: input.amountOriginal,
    amountFinal: applyBillingDiscount(
      input.amountOriginal,
      kind,
      coupon.discountValue
    ),
  };
}

export async function consumeBillingCouponForPayment(paymentId: string) {
  await prisma.billingCouponRedemption.updateMany({
    where: {
      paymentId,
      status: BillingCouponRedemptionStatus.RESERVED,
    },
    data: {
      status: BillingCouponRedemptionStatus.CONSUMED,
      consumedAt: new Date(),
    },
  });
}

export async function releaseBillingCouponForPayment(paymentId: string) {
  await prisma.$transaction(async (tx) => {
    const redemption = await tx.billingCouponRedemption.findUnique({
      where: { paymentId },
    });
    if (!redemption) return;
    if (redemption.status !== BillingCouponRedemptionStatus.RESERVED) return;

    await tx.billingCouponRedemption.update({
      where: { id: redemption.id },
      data: {
        status: BillingCouponRedemptionStatus.RELEASED,
        releasedAt: new Date(),
      },
    });

    await tx.billingCoupon.update({
      where: { id: redemption.couponId },
      data: { quantityRemaining: { increment: 1 } },
    });
  });
}

export async function releaseExpiredBillingCouponReservations() {
  const expiredPayments = await prisma.payment.findMany({
    where: {
      status: { in: ["EXPIRED", "CANCELLED"] },
      billingCouponId: { not: null },
      billingCouponRedemption: {
        status: BillingCouponRedemptionStatus.RESERVED,
      },
    },
    select: { id: true },
    take: 200,
  });

  for (const payment of expiredPayments) {
    await releaseBillingCouponForPayment(payment.id);
  }
}
