"use server";

import { redirect } from "next/navigation";
import {
  requestPasswordReset,
  resetPasswordWithToken,
} from "@/application/services/password-reset-service";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/schemas/provider-schemas";

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect(
      `/esqueci-senha?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "E-mail inválido")}`
    );
  }

  try {
    const message = await requestPasswordReset(parsed.data.email);
    redirect(`/esqueci-senha?sent=1&message=${encodeURIComponent(message)}`);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível enviar o e-mail de redefinição";

    redirect(`/esqueci-senha?error=${encodeURIComponent(message)}`);
  }
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const token = formData.get("token");
    const tokenQuery =
      typeof token === "string" && token
        ? `token=${encodeURIComponent(token)}&`
        : "";

    redirect(
      `/redefinir-senha?${tokenQuery}error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  try {
    await resetPasswordWithToken(parsed.data.token, parsed.data.newPassword);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível redefinir a senha";

    redirect(
      `/redefinir-senha?token=${encodeURIComponent(parsed.data.token)}&error=${encodeURIComponent(message)}`
    );
  }

  redirect("/entrar?reset=1");
}
