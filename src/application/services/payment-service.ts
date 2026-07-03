import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { PRICING } from "@/config/pricing";
import { PaymentStatus, PaymentType } from "@/domain/enums";
import { prisma } from "@/lib/prisma";
import { activatePremiumBoost } from "@/application/services/premium-service";
import { activateSubscription } from "@/application/services/subscription-service";

function generatePixTxId(): string {
  return `BZ${Date.now()}${randomBytes(4).toString("hex").toUpperCase()}`;
}

function generatePixCopyPaste(amount: number, txId: string): string {
  return `00020126580014BR.GOV.BCB.PIX0136${PRICING.PIX_KEY}520400005303986540${amount.toFixed(2)}5802BR5913BuscaZap Pag6009SAO PAULO62070503***6304${txId.slice(-4)}`;
}

export async function createSubscriptionPayment(providerId: string) {
  const amount = PRICING.SUBSCRIPTION_AMOUNT;
  const pixTxId = generatePixTxId();
  const expiresAt = new Date(
    Date.now() + PRICING.PAYMENT_EXPIRATION_MINUTES * 60 * 1000
  );

  return prisma.payment.create({
    data: {
      providerId,
      type: PaymentType.SUBSCRIPTION,
      amount,
      status: PaymentStatus.PENDING,
      pixTxId,
      pixCopyPaste: generatePixCopyPaste(amount, pixTxId),
      expiresAt,
    },
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

  const amount = PRICING.PREMIUM_BOOST_AMOUNT;
  const pixTxId = generatePixTxId();
  const expiresAt = new Date(
    Date.now() + PRICING.PAYMENT_EXPIRATION_MINUTES * 60 * 1000
  );

  return prisma.payment.create({
    data: {
      providerId,
      type: PaymentType.PREMIUM_BOOST,
      amount,
      status: PaymentStatus.PENDING,
      pixTxId,
      pixCopyPaste: generatePixCopyPaste(amount, pixTxId),
      referenceId: advertisementId,
      expiresAt,
    },
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
