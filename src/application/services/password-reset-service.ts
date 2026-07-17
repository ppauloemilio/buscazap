import bcrypt from "bcryptjs";
import { PASSWORD_RESET_CONFIG } from "@/config/password-reset";
import { ProviderStatus } from "@/domain/enums";
import { findProviderByLogin } from "@/application/services/provider-auth-service";
import {
  buildPasswordResetUrl,
  sendPasswordResetEmail,
} from "@/lib/email";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/lib/password-reset-token";
import { prisma } from "@/lib/prisma";

const GENERIC_SUCCESS_MESSAGE =
  "Se a conta tiver e-mail cadastrado, você receberá instruções para redefinir a senha em instantes.";

const NO_EMAIL_MESSAGE =
  "Esta conta não tem e-mail cadastrado. Peça ao administrador do BuscaZapp para redefinir sua senha.";

export async function requestPasswordReset(login: string): Promise<string> {
  const provider = await findProviderByLogin(login);

  if (!provider || provider.status === ProviderStatus.BLOCKED) {
    return GENERIC_SUCCESS_MESSAGE;
  }

  if (!provider.email) {
    return NO_EMAIL_MESSAGE;
  }

  const recentToken = await prisma.passwordResetToken.findFirst({
    where: {
      providerId: provider.id,
      usedAt: null,
      createdAt: {
        gte: new Date(
          Date.now() -
            PASSWORD_RESET_CONFIG.minRequestIntervalMinutes * 60 * 1000
        ),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentToken) {
    return GENERIC_SUCCESS_MESSAGE;
  }

  await prisma.passwordResetToken.updateMany({
    where: {
      providerId: provider.id,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  const rawToken = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_CONFIG.tokenExpiresMinutes * 60 * 1000
  );

  await prisma.passwordResetToken.create({
    data: {
      providerId: provider.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = buildPasswordResetUrl(rawToken);

  await sendPasswordResetEmail({
    to: provider.email,
    name: provider.name,
    resetUrl,
  });

  return GENERIC_SUCCESS_MESSAGE;
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<void> {
  const tokenHash = hashPasswordResetToken(token.trim());
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { provider: true },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    throw new Error("Link inválido ou expirado. Solicite uma nova redefinição.");
  }

  if (resetToken.provider.status === ProviderStatus.BLOCKED) {
    throw new Error("Sua conta está bloqueada. Entre em contato com o suporte.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.provider.update({
      where: { id: resetToken.providerId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        providerId: resetToken.providerId,
        usedAt: null,
        id: { not: resetToken.id },
      },
      data: { usedAt: new Date() },
    }),
  ]);
}
