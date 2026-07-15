import { randomBytes } from "crypto";
import { PRICING } from "@/config/pricing";
import {
  isManualPaymentMethod,
  type ManualPaymentMethod,
} from "@/config/manual-payment";
import { PaymentStatus, PaymentType, ProviderStatus, UserRole } from "@/domain/enums";
import { activatePremiumBoost } from "@/application/services/premium-service";
import { activateSubscription } from "@/application/services/subscription-service";
import { logAdminAction } from "@/application/services/admin-service";
import { prisma } from "@/lib/prisma";

export type { ManualPaymentMethod };

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

export function parseManualPaymentMethod(value: FormDataEntryValue | null): ManualPaymentMethod {
  if (typeof value !== "string" || !isManualPaymentMethod(value)) {
    throw new Error("Informe se foi dinheiro, permuta ou outro");
  }
  return value;
}

export async function registerManualSubscriptionAsAdmin(input: {
  readonly adminId: string;
  readonly providerId: string;
  readonly method: ManualPaymentMethod;
  readonly notes?: string;
}) {
  const provider = await prisma.provider.findUnique({
    where: { id: input.providerId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (!provider || provider.role !== UserRole.PROVIDER) {
    throw new Error("Anunciante não encontrado");
  }

  if (provider.status === ProviderStatus.BLOCKED) {
    throw new Error("Não é possível registrar assinatura para conta bloqueada");
  }

  const paidAt = new Date();
  const amount = resolveManualAmount(PaymentType.SUBSCRIPTION, input.method);

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        providerId: provider.id,
        type: PaymentType.SUBSCRIPTION,
        amount,
        status: PaymentStatus.PAID,
        pixTxId: generateManualPixTxId(),
        pixCopyPaste: `manual:${input.method}`,
        referenceId: `manual:${input.method}`,
        paidAt,
        expiresAt: paidAt,
      },
    });

    await activateSubscription(tx, provider.id, payment.id, paidAt);

    await tx.advertisement.updateMany({
      where: {
        providerId: provider.id,
        status: "INACTIVE",
      },
      data: { status: "APPROVED" },
    });

    const updated = await tx.provider.findUnique({
      where: { id: provider.id },
      select: { subscriptionExpiresAt: true },
    });

    return {
      paymentId: payment.id,
      expiresAt: updated?.subscriptionExpiresAt ?? null,
    };
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "MANUAL_SUBSCRIPTION",
    entityType: "Provider",
    entityId: provider.id,
    metadata: {
      method: input.method,
      amount,
      paymentId: result.paymentId,
      expiresAt: result.expiresAt?.toISOString() ?? null,
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
