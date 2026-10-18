"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  completeProviderClaim,
  getProviderByClaimToken,
  requestClaimOtp,
  verifyClaimOtp,
} from "@/application/services/provider-claim-service";
import { PROVIDER_SESSION_COOKIE } from "@/config/pricing";

export const CLAIM_SESSION_COOKIE = "buscazapp_claim_provider_id";

async function setClaimSession(providerId: string) {
  const cookieStore = await cookies();
  cookieStore.set(CLAIM_SESSION_COOKIE, providerId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
}

async function clearClaimSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CLAIM_SESSION_COOKIE);
}

export async function getClaimSessionProviderId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CLAIM_SESSION_COOKIE)?.value ?? null;
}

export async function startClaimWithTokenAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    redirect("/reivindicar?error=Link+inválido");
  }

  const provider = await getProviderByClaimToken(token);
  if (!provider) {
    redirect(
      `/reivindicar?error=${encodeURIComponent("Link inválido ou expirado. Solicite um novo pelo WhatsApp do anúncio.")}`
    );
  }

  await setClaimSession(provider.id);
  redirect("/reivindicar?step=password");
}

export async function requestClaimOtpAction(formData: FormData) {
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();

  let result;
  try {
    result = await requestClaimOtp(whatsapp);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível enviar o código";
    redirect(
      `/reivindicar?error=${encodeURIComponent(message)}&whatsapp=${encodeURIComponent(whatsapp)}`
    );
  }

  const q = new URLSearchParams({
    step: "otp",
    whatsapp,
    masked: result.maskedWhatsapp,
    delivery: result.delivery,
  });
  redirect(`/reivindicar?${q.toString()}`);
}

export async function verifyClaimOtpAction(formData: FormData) {
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  let providerId: string;
  try {
    ({ providerId } = await verifyClaimOtp({ whatsappRaw: whatsapp, code }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Código inválido";
    const q = new URLSearchParams({
      step: "otp",
      whatsapp,
      error: message,
    });
    redirect(`/reivindicar?${q.toString()}`);
  }

  await setClaimSession(providerId);
  redirect("/reivindicar?step=password");
}

export async function completeClaimPasswordAction(formData: FormData) {
  const providerId = await getClaimSessionProviderId();
  if (!providerId) {
    redirect(
      `/reivindicar?error=${encodeURIComponent("Sessão expirada. Recomece a reivindicação.")}`
    );
  }

  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (password !== passwordConfirm) {
    redirect(
      `/reivindicar?step=password&error=${encodeURIComponent("As senhas não coincidem")}`
    );
  }

  try {
    await completeProviderClaim({ providerId, newPassword: password });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível definir a senha";
    redirect(`/reivindicar?step=password&error=${encodeURIComponent(message)}`);
  }

  await clearClaimSession();

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, providerId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/painel");
  redirect("/painel?claimed=1");
}
