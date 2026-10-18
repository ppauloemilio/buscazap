import { createHash, randomBytes, randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppIdentity } from "@/lib/whatsapp";
import { ProviderStatus, UserRole } from "@/domain/enums";
import {
  isWhatsAppOtpSendConfigured,
  sendWhatsAppOtpText,
} from "@/lib/whatsapp-otp-send";
import { buildAbsoluteUrl } from "@/lib/site-url";

const CLAIM_TOKEN_DAYS = 30;
const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MIN_INTERVAL_MS = 60_000;

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function buildClaimUrl(token: string): string {
  return buildAbsoluteUrl(`/reivindicar?token=${encodeURIComponent(token)}`);
}

export async function issueProviderClaimToken(providerId: string): Promise<{
  readonly token: string;
  readonly claimUrl: string;
}> {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CLAIM_TOKEN_DAYS);

  await prisma.provider.update({
    where: { id: providerId },
    data: {
      claimToken: token,
      claimTokenExpiresAt: expiresAt,
    },
  });

  return { token, claimUrl: buildClaimUrl(token) };
}

export async function getProviderByClaimToken(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const provider = await prisma.provider.findFirst({
    where: {
      claimToken: trimmed,
      role: UserRole.PROVIDER,
      status: { not: ProviderStatus.BLOCKED },
    },
    select: {
      id: true,
      name: true,
      whatsapp: true,
      claimTokenExpiresAt: true,
      claimVerifiedAt: true,
      advertisements: {
        where: { status: { not: "INACTIVE" } },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          city: true,
          neighborhood: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!provider) return null;
  if (
    provider.claimTokenExpiresAt &&
    provider.claimTokenExpiresAt.getTime() < Date.now()
  ) {
    return null;
  }

  return provider;
}

export async function findClaimableProviderByWhatsapp(whatsappRaw: string) {
  const whatsapp =
    normalizeWhatsAppIdentity(whatsappRaw) ?? whatsappRaw.replace(/\D/g, "");
  if (!whatsapp || whatsapp.length < 10) {
    throw new Error("Informe um WhatsApp válido");
  }

  const provider = await prisma.provider.findFirst({
    where: {
      whatsapp,
      role: UserRole.PROVIDER,
      status: { not: ProviderStatus.BLOCKED },
    },
    select: {
      id: true,
      name: true,
      whatsapp: true,
      claimVerifiedAt: true,
      advertisements: {
        where: { status: { not: "INACTIVE" } },
        select: {
          id: true,
          title: true,
          city: true,
          neighborhood: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!provider || provider.advertisements.length === 0) {
    throw new Error(
      "Não encontramos anúncio público com este WhatsApp. Confira o número ou fale com o suporte."
    );
  }

  return provider;
}

export async function requestClaimOtp(whatsappRaw: string): Promise<{
  readonly providerId: string;
  readonly maskedWhatsapp: string;
  readonly adsCount: number;
  readonly delivery: "whatsapp" | "link_only";
}> {
  const provider = await findClaimableProviderByWhatsapp(whatsappRaw);

  const recent = await prisma.providerClaimChallenge.findFirst({
    where: {
      providerId: provider.id,
      usedAt: null,
      createdAt: { gte: new Date(Date.now() - OTP_MIN_INTERVAL_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    throw new Error("Aguarde cerca de 1 minuto antes de pedir um novo código.");
  }

  await prisma.providerClaimChallenge.updateMany({
    where: { providerId: provider.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);

  await prisma.providerClaimChallenge.create({
    data: {
      providerId: provider.id,
      whatsapp: provider.whatsapp,
      codeHash: hashValue(code),
      expiresAt,
    },
  });

  // Garante link de reivindicação válido (fallback se o OTP não puder ser enviado).
  await issueProviderClaimToken(provider.id);

  const text =
    `BuscaZapp: seu código para reivindicar o anúncio é ${code}. ` +
    `Válido por ${OTP_MINUTES} minutos. Não compartilhe.`;

  let delivery: "whatsapp" | "link_only" = "link_only";
  if (isWhatsAppOtpSendConfigured()) {
    const sent = await sendWhatsAppOtpText(provider.whatsapp, text);
    if (sent) {
      delivery = "whatsapp";
    }
  }

  const digits = provider.whatsapp.replace(/\D/g, "");
  const masked =
    digits.length >= 4
      ? `***${digits.slice(-4)}`
      : "***";

  return {
    providerId: provider.id,
    maskedWhatsapp: masked,
    adsCount: provider.advertisements.length,
    delivery,
  };
}

export async function verifyClaimOtp(input: {
  readonly whatsappRaw: string;
  readonly code: string;
}): Promise<{ readonly providerId: string }> {
  const provider = await findClaimableProviderByWhatsapp(input.whatsappRaw);
  const code = input.code.replace(/\D/g, "");
  if (code.length !== 6) {
    throw new Error("Informe o código de 6 dígitos");
  }

  const challenge = await prisma.providerClaimChallenge.findFirst({
    where: {
      providerId: provider.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    throw new Error("Código expirado. Solicite um novo.");
  }

  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.providerClaimChallenge.update({
      where: { id: challenge.id },
      data: { usedAt: new Date() },
    });
    throw new Error("Muitas tentativas. Solicite um novo código.");
  }

  const ok = challenge.codeHash === hashValue(code);
  if (!ok) {
    await prisma.providerClaimChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Código inválido");
  }

  await prisma.providerClaimChallenge.update({
    where: { id: challenge.id },
    data: { usedAt: new Date() },
  });

  return { providerId: provider.id };
}

export async function completeProviderClaim(input: {
  readonly providerId: string;
  readonly newPassword: string;
}): Promise<void> {
  if (input.newPassword.trim().length < 6) {
    throw new Error("A senha deve ter no mínimo 6 caracteres");
  }

  const provider = await prisma.provider.findUnique({
    where: { id: input.providerId },
    select: { id: true, role: true, status: true },
  });

  if (
    !provider ||
    provider.role !== UserRole.PROVIDER ||
    provider.status === ProviderStatus.BLOCKED
  ) {
    throw new Error("Conta inválida para reivindicação");
  }

  const passwordHash = await bcrypt.hash(input.newPassword.trim(), 10);

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      passwordHash,
      claimVerifiedAt: new Date(),
      claimToken: null,
      claimTokenExpiresAt: null,
    },
  });

  await prisma.providerClaimChallenge.updateMany({
    where: { providerId: provider.id, usedAt: null },
    data: { usedAt: new Date() },
  });
}
