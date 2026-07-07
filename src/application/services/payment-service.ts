import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { PRICING } from "@/config/pricing";
import { PaymentStatus, PaymentType } from "@/domain/enums";
import { getPixProvider } from "@/infrastructure/pix";
import { prisma } from "@/lib/prisma";
import { activatePremiumBoost } from "@/application/services/premium-service";
import { activateSubscription } from "@/application/services/subscription-service";

function generatePlaceholderPixTxId(): string {
  return `BZ${Date.now()}${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function initiatePayment(input: {
  providerId: string;
  providerEmail: string;
  providerName: string;
  type: PaymentType;
  amount: number;
  description: string;
  referenceId?: string;
}) {
  const expiresAt = new Date(
    Date.now() + PRICING.PAYMENT_EXPIRATION_MINUTES * 60 * 1000
  );

  const payment = await prisma.payment.create({
    data: {
      providerId: input.providerId,
      type: input.type,
      amount: input.amount,
      status: PaymentStatus.PENDING,
      pixTxId: generatePlaceholderPixTxId(),
      pixCopyPaste: "pending",
      referenceId: input.referenceId,
      expiresAt,
    },
  });

  try {
    const charge = await getPixProvider().createCharge({
      amount: input.amount,
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
    throw error;
  }
}

async function getProviderPaymentProfile(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { email: true, name: true },
  });

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  return provider;
}

export async function createSubscriptionPayment(providerId: string) {
  const provider = await getProviderPaymentProfile(providerId);

  return initiatePayment({
    providerId,
    providerEmail: provider.email,
    providerName: provider.name,
    type: PaymentType.SUBSCRIPTION,
    amount: PRICING.SUBSCRIPTION_AMOUNT,
    description: "Assinatura mensal BuscaZap",
  });
}

export async function createPremiumBoostPayment(
  providerId: string,
  advertisementId: string
) {
  const advertisement = await prisma.advertisement.findFirst({
    where: { id: advertisementId, providerId },
  });

  if (!advertisement) {
    throw new Error("ADVERTISEMENT_NOT_FOUND");
  }

  const provider = await getProviderPaymentProfile(providerId);

  return initiatePayment({
    providerId,
    providerEmail: provider.email,
    providerName: provider.name,
    type: PaymentType.PREMIUM_BOOST,
    amount: PRICING.PREMIUM_BOOST_AMOUNT,
    description: `Destaque premium: ${advertisement.title}`,
    referenceId: advertisementId,
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

  return prisma.payment.findUnique({ where: { id: payment.id } });
}

export async function expirePendingPayments() {
  const now = new Date();

  await prisma.payment.updateMany({
    where: {
      status: PaymentStatus.PENDING,
      expiresAt: { lt: now },
    },
    data: { status: PaymentStatus.EXPIRED },
  });
}
