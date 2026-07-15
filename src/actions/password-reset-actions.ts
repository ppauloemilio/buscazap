"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
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
    login: formData.get("login") ?? formData.get("email"),
  });

  if (!parsed.success) {
    redirect(
      `/esqueci-senha?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  let message: string;

  try {
    message = await requestPasswordReset(parsed.data.login);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Não foi possível enviar o e-mail de redefinição";

    redirect(`/esqueci-senha?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect(`/esqueci-senha?sent=1&message=${encodeURIComponent(message)}`);
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
    if (isRedirectError(error)) {
      throw error;
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Não foi possível redefinir a senha";

    redirect(
      `/redefinir-senha?token=${encodeURIComponent(parsed.data.token)}&error=${encodeURIComponent(errorMessage)}`
    );
  }

  redirect("/entrar?reset=1");
}
