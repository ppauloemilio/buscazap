import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { PRICING } from "@/config/pricing";
import {
  BillingCouponTarget,
  BillingDiscountKind,
  PaymentStatus,
  PaymentType,
  SUBSCRIPTION_TIER_REFERENCE,
  SubscriptionTier,
} from "@/domain/enums";
import { isPlusPlanOfferEnabled } from "@/lib/plus-plan";
import { getPixProvider } from "@/infrastructure/pix";
import { prisma } from "@/lib/prisma";
import {
  canPurchasePremiumBoost,
  canRenewSubscription,
  hasActiveSubscription,
} from "@/lib/provider-session";
import {
  calculateProRataUpgradeAmount,
  isEligibleForProRataUpgrade,
} from "@/lib/subscription-proration";
import { toLocalWhatsAppDigits } from "@/lib/whatsapp";
import { activatePremiumBoost } from "@/application/services/premium-service";
import { activateSubscription } from "@/application/services/subscription-service";
import {
  consumeBillingCouponForPayment,
  previewBillingCoupon,
  releaseBillingCouponForPayment,
  releaseExpiredBillingCouponReservations,
  reserveBillingCouponWithPayment,
  resolveTargetForSubscriptionTier,
  type AppliedBillingCoupon,
} from "@/application/services/billing-coupon-service";
import { getLivePricing } from "@/application/services/pricing-settings-service";

function generatePlaceholderPixTxId(): string {
  return `BZ${Date.now()}${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function initiatePayment(input: {
  providerId: string;
  providerEmail: string;
  providerName: string;
  providerCity: string | null | undefined;
  type: PaymentType;
  amountOriginal: number;
  description: string;
  referenceId?: string;
  targetFeature: BillingCouponTarget;
  couponPreview?: AppliedBillingCoupon | null;
}) {
  const expiresAt = new Date(
    Date.now() + PRICING.PAYMENT_EXPIRATION_MINUTES * 60 * 1000
  );

  const amountOriginal =
    Math.round(Math.max(0, input.amountOriginal) * 100) / 100;
  const previewFinal = input.couponPreview?.amountFinal ?? amountOriginal;
  const isFree = previewFinal <= 0;

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        providerId: input.providerId,
        type: input.type,
        amount: amountOriginal,
        status: isFree ? PaymentStatus.PAID : PaymentStatus.PENDING,
        pixTxId: generatePlaceholderPixTxId(),
        pixCopyPaste: isFree ? "FREE_COUPON" : "pending",
        referenceId: input.referenceId,
        expiresAt: isFree ? new Date() : expiresAt,
        paidAt: isFree ? new Date() : null,
      },
    });

    if (input.couponPreview) {
      const coupon = await reserveBillingCouponWithPayment({
        couponId: input.couponPreview.couponId,
        providerId: input.providerId,
        paymentId: created.id,
        providerCity: input.providerCity,
        targetFeature: input.targetFeature,
        amountOriginal,
        tx,
      });

      return tx.payment.update({
        where: { id: created.id },
        data: {
          amount: coupon.amountFinal,
          amountOriginal,
          billingCouponId: coupon.couponId,
          billingCouponCode: coupon.code,
          discountKind: coupon.discountKind,
          discountValue: coupon.discountValue,
        },
      });
    }

    return created;
  });

  const amount = payment.amount;
  const hasCoupon = Boolean(payment.billingCouponId);

  if (isFree || amount <= 0) {
    const paidAt = payment.paidAt ?? new Date();
    if (payment.status !== PaymentStatus.PAID) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt,
          amount: 0,
          pixCopyPaste: "FREE_COUPON",
        },
      });
    }
    await prisma.$transaction(async (tx) => {
      if (input.type === PaymentType.SUBSCRIPTION) {
        await activateSubscription(tx, input.providerId, payment.id, paidAt);
      } else if (
        input.type === PaymentType.PREMIUM_BOOST &&
        input.referenceId
      ) {
        await activatePremiumBoost(
          tx,
          input.providerId,
          input.referenceId,
          payment.id,
          paidAt
        );
      }
    });
    if (hasCoupon) {
      await consumeBillingCouponForPayment(payment.id);
    }
    return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  }

  try {
    const charge = await getPixProvider().createCharge({
      amount,
      description: input.description,
      payerEmail: input.providerEmail,
      payerName: input.providerName,
      externalReference: payment.id,
    });

    return prisma.payment.update({
      where: { id: payment.id },
      data: {
        pixTxId: charge.pixTxId,
        pixCopyPaste: charge.pixCopyPaste,
      },
    });
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.CANCELLED },
    });
    if (hasCoupon) {
      await releaseBillingCouponForPayment(payment.id);
    }
    throw error;
  }
}

async function getProviderPaymentProfile(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      email: true,
      name: true,
      whatsapp: true,
      role: true,
      city: true,
      subscriptionExpiresAt: true,
      subscriptionTier: true,
    },
  });

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  const payerEmail =
    provider.email?.trim() ||
    `${toLocalWhatsAppDigits(provider.whatsapp)}@pagadores.buscazapp.com.br`;

  return {
    name: provider.name,
    email: payerEmail,
    city: provider.city,
    role: provider.role,
    subscriptionExpiresAt: provider.subscriptionExpiresAt,
    subscriptionTier: provider.subscriptionTier,
  };
}

async function resolveCouponPreview(input: {
  readonly couponCode?: string | null;
  readonly providerId: string;
  readonly providerCity: string | null | undefined;
  readonly targetFeature: BillingCouponTarget;
  readonly amountOriginal: number;
  /** Upgrade pró-rata não aceita cupom (valor já proporcional). */
  readonly allowCoupon: boolean;
}): Promise<AppliedBillingCoupon | null> {
  const code = input.couponCode?.trim();
  if (!code) return null;
  if (!input.allowCoupon) {
    throw new Error(
      "Cupom não pode ser usado no upgrade proporcional. Use na mensalidade cheia."
    );
  }

  return previewBillingCoupon({
    code,
    providerId: input.providerId,
    providerCity: input.providerCity,
    targetFeature: input.targetFeature,
    amountOriginal: input.amountOriginal,
  });
}

export async function createSubscriptionPayment(
  providerId: string,
  options?: {
    readonly bypassRenewalWindow?: boolean;
    readonly tier?: SubscriptionTier;
    /**
     * Com tier PLUS: cobra a mensalidade cheia do Pro (sem pro-rata),
     * mesmo com Básico ainda vigente. Usado pelo admin em "Assinar Pro".
     */
    readonly forceFullAmount?: boolean;
    /** Exige elegibilidade ao upgrade pro-rata Básico → Pro. */
    readonly requireProRataUpgrade?: boolean;
    readonly couponCode?: string | null;
  }
) {
  const provider = await getProviderPaymentProfile(providerId);
  const pricing = await getLivePricing();
  const tier = options?.tier ?? SubscriptionTier.BASIC;

  if (tier === SubscriptionTier.PLUS && !(await isPlusPlanOfferEnabled())) {
    throw new Error("Plano Pro indisponível no momento");
  }

  const hasActive = hasActiveSubscription(provider.subscriptionExpiresAt);
  const eligibleProRata =
    tier === SubscriptionTier.PLUS &&
    isEligibleForProRataUpgrade({
      role: provider.role,
      subscriptionExpiresAt: provider.subscriptionExpiresAt,
      subscriptionTier: provider.subscriptionTier,
    });

  if (options?.requireProRataUpgrade && !eligibleProRata) {
    throw new Error(
      "Migrar para Pro só vale com Plano Básico ainda vigente. Use Assinar Pro se a assinatura estiver vencida."
    );
  }

  const proRataUpgrade = eligibleProRata && !options?.forceFullAmount;

  const upgradingToPlusWhileActive = tier === SubscriptionTier.PLUS && hasActive;

  if (
    !options?.bypassRenewalWindow &&
    !upgradingToPlusWhileActive &&
    hasActive &&
    !canRenewSubscription(provider.subscriptionExpiresAt)
  ) {
    throw new Error(
      `A renovação fica disponível nos últimos ${PRICING.SUBSCRIPTION_RENEWAL_WINDOW_DAYS} dias da assinatura.`
    );
  }

  let amount: number =
    tier === SubscriptionTier.PLUS
      ? pricing.subscriptionPlusAmount
      : pricing.subscriptionAmount;
  let referenceId: string =
    tier === SubscriptionTier.PLUS
      ? SUBSCRIPTION_TIER_REFERENCE.PLUS
      : SUBSCRIPTION_TIER_REFERENCE.BASIC;
  let description = `Assinatura mensal BuscaZapp — ${
    tier === SubscriptionTier.PLUS ? "Plano Pro" : "Plano Básico"
  }`;

  if (proRataUpgrade && provider.subscriptionExpiresAt) {
    amount = calculateProRataUpgradeAmount(provider.subscriptionExpiresAt, new Date(), {
      basic: pricing.subscriptionAmount,
      plus: pricing.subscriptionPlusAmount,
    });
    referenceId = SUBSCRIPTION_TIER_REFERENCE.PLUS_UPGRADE;
    const validUntil = provider.subscriptionExpiresAt.toLocaleDateString("pt-BR");
    description = `Upgrade proporcional para Plano Pro (válido até ${validUntil})`;
  }

  const targetFeature = resolveTargetForSubscriptionTier(tier);
  const couponPreview = await resolveCouponPreview({
    couponCode: options?.couponCode,
    providerId,
    providerCity: provider.city,
    targetFeature,
    amountOriginal: amount,
    allowCoupon: !proRataUpgrade,
  });

  if (couponPreview) {
    description = `${description} (cupom ${couponPreview.code})`;
  }

  return initiatePayment({
    providerId,
    providerEmail: provider.email,
    providerName: provider.name,
    providerCity: provider.city,
    type: PaymentType.SUBSCRIPTION,
    amountOriginal: amount,
    description,
    referenceId,
    targetFeature,
    couponPreview,
  });
}

export async function createPremiumBoostPayment(
  providerId: string,
  advertisementId: string,
  options?: { readonly couponCode?: string | null }
) {
  const advertisement = await prisma.advertisement.findFirst({
    where: { id: advertisementId, providerId },
  });

  if (!advertisement) {
    throw new Error("ADVERTISEMENT_NOT_FOUND");
  }

  const provider = await getProviderPaymentProfile(providerId);
  const pricing = await getLivePricing();

  if (
    !canPurchasePremiumBoost({
      role: provider.role,
      subscriptionExpiresAt: provider.subscriptionExpiresAt,
    })
  ) {
    throw new Error("PREMIUM_REQUIRES_PAID_PLAN");
  }

  const amountOriginal = pricing.premiumBoostAmount;
  const couponPreview = await resolveCouponPreview({
    couponCode: options?.couponCode,
    providerId,
    providerCity: provider.city,
    targetFeature: BillingCouponTarget.PREMIUM_BOOST,
    amountOriginal,
    allowCoupon: true,
  });

  return initiatePayment({
    providerId,
    providerEmail: provider.email,
    providerName: provider.name,
    providerCity: provider.city,
    type: PaymentType.PREMIUM_BOOST,
    amountOriginal,
    description: `Destaque premium: ${advertisement.title}${
      couponPreview ? ` (cupom ${couponPreview.code})` : ""
    }`,
    referenceId: advertisementId,
    targetFeature: BillingCouponTarget.PREMIUM_BOOST,
    couponPreview,
  });
}

export async function getPaymentById(paymentId: string, providerId?: string) {
  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      ...(providerId ? { providerId } : {}),
    },
  });
}

export async function getProviderPayments(providerId: string) {
  return prisma.payment.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function generatePaymentQrCode(pixCopyPaste: string): Promise<string> {
  return QRCode.toDataURL(pixCopyPaste, { width: 256, margin: 2 });
}

export async function confirmPayment(pixTxId: string) {
  const payment = await prisma.payment.findUnique({
    where: { pixTxId },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  if (payment.status === PaymentStatus.PAID) {
    return payment;
  }

  if (payment.status !== PaymentStatus.PENDING) {
    throw new Error("PAYMENT_NOT_PENDING");
  }

  if (payment.expiresAt.getTime() < Date.now()) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.EXPIRED },
    });
    await releaseBillingCouponForPayment(payment.id);
    throw new Error("PAYMENT_EXPIRED");
  }

  const paidAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        paidAt,
      },
    });

    if (payment.type === PaymentType.SUBSCRIPTION) {
      await activateSubscription(tx, payment.providerId, payment.id, paidAt);
      return;
    }

    if (payment.type === PaymentType.PREMIUM_BOOST && payment.referenceId) {
      await activatePremiumBoost(
        tx,
        payment.providerId,
        payment.referenceId,
        payment.id,
        paidAt
      );
    }
  });

  await consumeBillingCouponForPayment(payment.id);

  return prisma.payment.findUnique({ where: { id: payment.id } });
}

export async function expirePendingPayments() {
  const now = new Date();

  const expired = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PENDING,
      expiresAt: { lt: now },
    },
    select: { id: true },
  });

  if (expired.length > 0) {
    await prisma.payment.updateMany({
      where: { id: { in: expired.map((item) => item.id) } },
      data: { status: PaymentStatus.EXPIRED },
    });

    for (const payment of expired) {
      await releaseBillingCouponForPayment(payment.id);
    }
  }

  await releaseExpiredBillingCouponReservations();
}

export { BillingDiscountKind };
