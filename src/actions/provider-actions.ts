"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { PROVIDER_SESSION_COOKIE } from "@/config/pricing";
import {
  createPremiumBoostPayment,
  createSubscriptionPayment,
} from "@/application/services/payment-service";
import { prisma } from "@/lib/prisma";
import {
  getCurrentProvider,
  hasActiveSubscription,
  requireCurrentProvider,
} from "@/lib/provider-session";
import {
  createAdvertisementSchema,
  loginProviderSchema,
  registerProviderSchema,
} from "@/schemas/provider-schemas";
import { createAdvertisement } from "@/application/services/advertisement-service";

function redirectWithPaymentError(returnPath: string, error: unknown): never {
  const message =
    error instanceof Error
      ? error.message
      : "Não foi possível gerar o pagamento PIX";
  redirect(`${returnPath}?error=${encodeURIComponent(message)}`);
}

export async function registerProviderAction(formData: FormData) {
  const parsed = registerProviderSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      `/cadastro?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  const existing = await prisma.provider.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    redirect(`/cadastro?error=${encodeURIComponent("E-mail já cadastrado")}`);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const provider = await prisma.provider.create({
    data: {
      ...parsed.data,
      passwordHash,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, provider.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/painel/assinatura");
}

export async function loginProviderAction(formData: FormData) {
  const parsed = loginProviderSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      `/entrar?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  const provider = await prisma.provider.findUnique({
    where: { email: parsed.data.email },
  });

  if (!provider) {
    redirect(`/entrar?error=${encodeURIComponent("Credenciais inválidas")}`);
  }

  const valid = await bcrypt.compare(parsed.data.password, provider.passwordHash);

  if (!valid) {
    redirect(`/entrar?error=${encodeURIComponent("Credenciais inválidas")}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, provider.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/painel");
}

export async function logoutProviderAction() {
  const cookieStore = await cookies();
  cookieStore.delete(PROVIDER_SESSION_COOKIE);
  redirect("/");
}

export async function createSubscriptionPaymentAction() {
  const provider = await requireCurrentProvider();

  try {
    const payment = await createSubscriptionPayment(provider.id);
    redirect(`/pagamento/${payment.id}`);
  } catch (error) {
    redirectWithPaymentError("/painel/assinatura", error);
  }
}

export async function createPremiumPaymentAction(advertisementId: string) {
  const provider = await requireCurrentProvider();

  if (!hasActiveSubscription(provider.subscriptionExpiresAt)) {
    redirect("/painel/assinatura");
  }

  try {
    const payment = await createPremiumBoostPayment(provider.id, advertisementId);
    redirect(`/pagamento/${payment.id}`);
  } catch (error) {
    redirectWithPaymentError("/painel/anuncios", error);
  }
}

export async function boostAdvertisementAction(formData: FormData) {
  const advertisementId = formData.get("advertisementId");

  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/painel/anuncios");
  }

  await createPremiumPaymentAction(advertisementId);
}

export async function createAdvertisementAction(formData: FormData) {
  const provider = await requireCurrentProvider();

  if (!hasActiveSubscription(provider.subscriptionExpiresAt)) {
    redirect("/painel/assinatura");
  }

  const parsed = createAdvertisementSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    category: formData.get("category"),
    city: formData.get("city"),
    state: formData.get("state"),
    neighborhood: formData.get("neighborhood") || undefined,
    whatsappNumber: formData.get("whatsappNumber"),
    withPremium: formData.get("withPremium") === "on",
  });

  if (!parsed.success) {
    redirect(
      `/painel/anuncios/novo?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  const result = await createAdvertisement({
    providerId: provider.id,
    ...parsed.data,
  });

  revalidatePath("/painel/anuncios");
  revalidatePath("/buscar");
  revalidatePath("/");

  if (result.requiresPremiumPayment) {
    try {
      const payment = await createPremiumBoostPayment(
        provider.id,
        result.advertisement.id
      );
      redirect(`/pagamento/${payment.id}`);
    } catch (error) {
      redirectWithPaymentError("/painel/anuncios", error);
    }
  }

  redirect("/painel/anuncios");
}

export async function getProviderSessionAction() {
  const provider = await getCurrentProvider();
  if (!provider) return null;

  return {
    id: provider.id,
    name: provider.name,
    email: provider.email,
    hasSubscription: hasActiveSubscription(provider.subscriptionExpiresAt),
    subscriptionExpiresAt: provider.subscriptionExpiresAt?.toISOString() ?? null,
  };
}
