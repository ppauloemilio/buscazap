import { randomBytes } from "crypto";
import { PRICING } from "@/config/pricing";
import {
  isManualPaymentMethod,
  type ManualPaymentMethod,
} from "@/config/manual-payment";
import {
  PaymentStatus,
  PaymentType,
  ProviderStatus,
  SUBSCRIPTION_TIER_REFERENCE,
  UserRole,
} from "@/domain/enums";
import { activatePremiumBoost } from "@/application/services/premium-service";
import { activateSubscription } from "@/application/services/subscription-service";
import { logAdminAction } from "@/application/services/admin-service";
import { prisma } from "@/lib/prisma";
import {
  calculateProRataUpgradeAmount,
  isEligibleForProRataUpgrade,
} from "@/lib/subscription-proration";

export type { ManualPaymentMethod };

/** basic = Plano Básico; plus = Assinar/renovar Pro; plus_upgrade = Migrar Básico→Pro (pro-rata). */
export type ManualSubscriptionMode = "basic" | "plus" | "plus_upgrade";

function generateManualPixTxId(): string {
  return `MANUAL${Date.now()}${randomBytes(3).toString("hex").toUpperCase()}`;
}

function resolveManualAmount(type: PaymentType, method: ManualPaymentMethod): number {
  if (method !== "CASH") {
    return 0;
  }

  return type === PaymentType.SUBSCRIPTION
    ? PRICING.SUBSCRIPTION_AMOUNT
    : PRICING.PREMIUM_BOOST_AMOUNT;
}

function resolveManualSubscriptionAmount(
  mode: ManualSubscriptionMode,
  method: ManualPaymentMethod,
  subscriptionExpiresAt: Date | null
): number {
  if (method !== "CASH") {
    return 0;
  }

  if (mode === "plus_upgrade") {
    if (!subscriptionExpiresAt) {
      throw new Error("Upgrade pro-rata exige assinatura básica vigente");
    }
    return calculateProRataUpgradeAmount(subscriptionExpiresAt);
  }

  if (mode === "plus") {
    return PRICING.SUBSCRIPTION_PLUS_AMOUNT;
  }

  return PRICING.SUBSCRIPTION_AMOUNT;
}

function resolveSubscriptionReferenceId(mode: ManualSubscriptionMode): string {
  if (mode === "plus_upgrade") {
    return SUBSCRIPTION_TIER_REFERENCE.PLUS_UPGRADE;
  }
  if (mode === "plus") {
    return SUBSCRIPTION_TIER_REFERENCE.PLUS;
  }
  return SUBSCRIPTION_TIER_REFERENCE.BASIC;
}

export function parseManualPaymentMethod(value: FormDataEntryValue | null): ManualPaymentMethod {
  if (typeof value !== "string" || !isManualPaymentMethod(value)) {
    throw new Error("Informe se foi dinheiro, permuta ou outro");
  }
  return value;
}

export function parseManualSubscriptionMode(
  value: FormDataEntryValue | null
): ManualSubscriptionMode {
  if (value === "plus" || value === "plus_upgrade") {
    return value;
  }
  return "basic";
}

export async function registerManualSubscriptionAsAdmin(input: {
  readonly adminId: string;
  readonly providerId: string;
  readonly method: ManualPaymentMethod;
  readonly notes?: string;
  readonly mode?: ManualSubscriptionMode;
}) {
  const mode = input.mode ?? "basic";

  const provider = await prisma.provider.findUnique({
    where: { id: input.providerId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      subscriptionExpiresAt: true,
      subscriptionTier: true,
    },
  });

  if (!provider || provider.role !== UserRole.PROVIDER) {
    throw new Error("Anunciante não encontrado");
  }

  if (provider.status === ProviderStatus.BLOCKED) {
    throw new Error("Não é possível registrar assinatura para conta bloqueada");
  }

  if (mode === "plus_upgrade") {
    if (
      !isEligibleForProRataUpgrade({
        role: provider.role,
        subscriptionExpiresAt: provider.subscriptionExpiresAt,
        subscriptionTier: provider.subscriptionTier,
      })
    ) {
      throw new Error(
        "Migrar para Pro só vale com Plano Básico ainda vigente. Use Assinar Pro se a assinatura estiver vencida."
      );
    }
  }

  const paidAt = new Date();
  const amount = resolveManualSubscriptionAmount(
    mode,
    input.method,
    provider.subscriptionExpiresAt
  );
  const referenceId = resolveSubscriptionReferenceId(mode);

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        providerId: provider.id,
        type: PaymentType.SUBSCRIPTION,
        amount,
        status: PaymentStatus.PAID,
        pixTxId: generateManualPixTxId(),
        pixCopyPaste: `manual:${input.method}:${mode}`,
        referenceId,
        paidAt,
        expiresAt: paidAt,
      },
    });

    await activateSubscription(tx, provider.id, payment.id, paidAt);

    const updated = await tx.provider.findUnique({
      where: { id: provider.id },
      select: { subscriptionExpiresAt: true, subscriptionTier: true },
    });

    return {
      paymentId: payment.id,
      expiresAt: updated?.subscriptionExpiresAt ?? null,
      subscriptionTier: updated?.subscriptionTier ?? null,
    };
  });

  await logAdminAction({
    adminId: input.adminId,
    action:
      mode === "plus_upgrade"
        ? "MANUAL_SUBSCRIPTION_PLUS_UPGRADE"
        : mode === "plus"
          ? "MANUAL_SUBSCRIPTION_PLUS"
          : "MANUAL_SUBSCRIPTION",
    entityType: "Provider",
    entityId: provider.id,
    metadata: {
      method: input.method,
      mode,
      amount,
      paymentId: result.paymentId,
      expiresAt: result.expiresAt?.toISOString() ?? null,
      subscriptionTier: result.subscriptionTier,
      notes: input.notes ?? null,
      providerEmail: provider.email,
      providerName: provider.name,
    },
  });

  return result;
}

export async function registerManualPremiumBoostAsAdmin(input: {
  readonly adminId: string;
  readonly advertisementId: string;
  readonly method: ManualPaymentMethod;
  readonly notes?: string;
}) {
  const advertisement = await prisma.advertisement.findUnique({
    where: { id: input.advertisementId },
    select: {
      id: true,
      title: true,
      providerId: true,
      status: true,
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!advertisement || advertisement.provider.role !== UserRole.PROVIDER) {
    throw new Error("Anúncio não encontrado");
  }

  if (advertisement.provider.status === ProviderStatus.BLOCKED) {
    throw new Error("Não é possível destacar anúncio de conta bloqueada");
  }

  if (advertisement.status === "BLOCKED") {
    throw new Error("Não é possível destacar anúncio bloqueado");
  }

  const paidAt = new Date();
  const amount = resolveManualAmount(PaymentType.PREMIUM_BOOST, input.method);

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        providerId: advertisement.providerId,
        type: PaymentType.PREMIUM_BOOST,
        amount,
        status: PaymentStatus.PAID,
        pixTxId: generateManualPixTxId(),
        pixCopyPaste: `manual:${input.method}`,
        referenceId: advertisement.id,
        paidAt,
        expiresAt: paidAt,
      },
    });

    await activatePremiumBoost(
      tx,
      advertisement.providerId,
      advertisement.id,
      payment.id,
      paidAt
    );

    const updated = await tx.advertisement.findUnique({
      where: { id: advertisement.id },
      select: { premiumExpiresAt: true },
    });

    return {
      paymentId: payment.id,
      expiresAt: updated?.premiumExpiresAt ?? null,
    };
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "MANUAL_PREMIUM_BOOST",
    entityType: "Advertisement",
    entityId: advertisement.id,
    metadata: {
      method: input.method,
      amount,
      paymentId: result.paymentId,
      expiresAt: result.expiresAt?.toISOString() ?? null,
      notes: input.notes ?? null,
      advertisementTitle: advertisement.title,
      providerId: advertisement.providerId,
      providerEmail: advertisement.provider.email,
    },
  });

  return result;
}
