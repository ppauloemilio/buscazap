"use server";

import { redirect } from "next/navigation";
import {
  createClaimRequest,
  createClaimRequestFromToken,
} from "@/application/services/provider-claim-service";

export async function startClaimWithTokenAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    redirect("/reivindicar?error=Link+inválido");
  }

  let result;
  try {
    result = await createClaimRequestFromToken(token);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível iniciar";
    redirect(`/reivindicar?error=${encodeURIComponent(message)}`);
  }

  const q = new URLSearchParams({
    step: "send",
    code: result.codeMessage,
    name: result.providerName,
  });
  redirect(`/reivindicar?${q.toString()}`);
}

export async function requestClaimAction(formData: FormData) {
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();

  let result;
  try {
    result = await createClaimRequest(whatsapp);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível iniciar a reivindicação";
    redirect(
      `/reivindicar?error=${encodeURIComponent(message)}&whatsapp=${encodeURIComponent(whatsapp)}`
    );
  }

  const q = new URLSearchParams({
    step: "send",
    whatsapp,
    code: result.codeMessage,
    name: result.providerName,
  });
  redirect(`/reivindicar?${q.toString()}`);
}

/** Usuário confirma que já enviou a mensagem — só mostra tela de espera. */
export async function confirmClaimSentAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const q = new URLSearchParams({ step: "done" });
  if (code) q.set("code", code);
  if (name) q.set("name", name);
  redirect(`/reivindicar?${q.toString()}`);
}
