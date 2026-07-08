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
  isProviderBlocked,
  requireCurrentProvider,
} from "@/lib/provider-session";
import {
  createAdvertisementSchema,
  loginProviderSchema,
  registerProviderSchema,
  resolveAdvertisementCategory,
  updateProviderProfileSchema,
  updateProviderPasswordSchema,
} from "@/schemas/provider-schemas";
import {
  createAdvertisement,
  deleteProviderAdvertisement,
} from "@/application/services/advertisement-service";

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
      role: "PROVIDER",
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

  if (isProviderBlocked(provider.status)) {
    redirect(
      `/entrar?error=${encodeURIComponent("Sua conta está bloqueada. Entre em contato com o suporte.")}`
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, provider.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  if (provider.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/painel");
}

export async function logoutProviderAction() {
  const cookieStore = await cookies();
  cookieStore.delete(PROVIDER_SESSION_COOKIE);
  redirect("/");
}

export async function createSubscriptionPaymentAction() {
  const provider = await requireCurrentProvider();
  let payment;

  try {
    payment = await createSubscriptionPayment(provider.id);
  } catch (error) {
    redirectWithPaymentError("/painel/assinatura", error);
  }

  redirect(`/pagamento/${payment.id}`);
}

export async function createPremiumPaymentAction(advertisementId: string) {
  const provider = await requireCurrentProvider();

  if (!hasActiveSubscription(provider.subscriptionExpiresAt)) {
    redirect("/painel/assinatura");
  }

  let payment;

  try {
    payment = await createPremiumBoostPayment(provider.id, advertisementId);
  } catch (error) {
    redirectWithPaymentError("/painel/anuncios", error);
  }

  redirect(`/pagamento/${payment.id}`);
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
    customCategory: formData.get("customCategory"),
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

  const { customCategory: _customCategory, ...advertisementData } = parsed.data;

  const result = await createAdvertisement({
    providerId: provider.id,
    ...advertisementData,
    category: resolveAdvertisementCategory(parsed.data),
  });

  revalidatePath("/painel/anuncios");
  revalidatePath("/buscar");
  revalidatePath("/");

  if (result.requiresPremiumPayment) {
    let payment;

    try {
      payment = await createPremiumBoostPayment(
        provider.id,
        result.advertisement.id
      );
    } catch (error) {
      redirectWithPaymentError("/painel/anuncios", error);
    }

    redirect(`/pagamento/${payment.id}`);
  }

  redirect("/painel/anuncios");
}

export async function deleteAdvertisementAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const advertisementId = formData.get("advertisementId");

  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/painel/anuncios");
  }

  try {
    await deleteProviderAdvertisement(provider.id, advertisementId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível excluir o anúncio";
    redirect(`/painel/anuncios?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/painel/anuncios");
  revalidatePath("/buscar");
  revalidatePath("/");

  redirect("/painel/anuncios?deleted=1");
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

export async function updateProviderProfileAction(formData: FormData) {
  const provider = await requireCurrentProvider();

  const parsed = updateProviderProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    age: formData.get("age"),
    state: formData.get("state"),
    city: formData.get("city"),
    neighborhood: formData.get("neighborhood"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    redirect(
      `/painel/perfil?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  if (parsed.data.email !== provider.email) {
    const existing = await prisma.provider.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing && existing.id !== provider.id) {
      redirect(
        `/painel/perfil?error=${encodeURIComponent("Este e-mail já está em uso")}`
      );
    }
  }

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp,
      age: parsed.data.age ?? null,
      state: parsed.data.state ?? null,
      city: parsed.data.city ?? null,
      neighborhood: parsed.data.neighborhood ?? null,
      bio: parsed.data.bio ?? null,
    },
  });

  revalidatePath("/painel");
  revalidatePath("/painel/perfil");

  redirect("/painel/perfil?saved=1");
}

export async function updateProviderPasswordAction(formData: FormData) {
  const provider = await requireCurrentProvider();

  const parsed = updateProviderPasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect(
      `/painel/perfil?passwordError=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  const validCurrent = await bcrypt.compare(
    parsed.data.currentPassword,
    provider.passwordHash
  );

  if (!validCurrent) {
    redirect(
      `/painel/perfil?passwordError=${encodeURIComponent("Senha atual incorreta")}`
    );
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    redirect(
      `/painel/perfil?passwordError=${encodeURIComponent("A nova senha deve ser diferente da atual")}`
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.provider.update({
    where: { id: provider.id },
    data: { passwordHash },
  });

  revalidatePath("/painel/perfil");

  redirect("/painel/perfil?passwordSaved=1");
}
