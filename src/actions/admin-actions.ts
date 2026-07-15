"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  createAdvertisementAsAdmin,
  createProviderAsAdmin,
  createReport,
  deleteAdvertisementAsAdmin,
  deleteProviderAsAdmin,
  resetProviderPasswordAsAdmin,
  updateAdvertisementStatusAsAdmin,
  updateProviderStatusAsAdmin,
  updateReportStatusAsAdmin,
} from "@/application/services/admin-service";
import { updateHomepageSettings } from "@/application/services/homepage-settings-service";
import {
  parseManualPaymentMethod,
  registerManualPremiumBoostAsAdmin,
  registerManualSubscriptionAsAdmin,
} from "@/application/services/admin-manual-billing-service";
import { PROVIDER_SESSION_COOKIE } from "@/config/pricing";
import { getCurrentAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import {
  adminCreateAdvertisementSchema,
  adminCreateProviderSchema,
  adminResetProviderPasswordSchema,
  loginAdminSchema,
} from "@/schemas/provider-schemas";
import { UserRole } from "@/domain/enums";

function redirectWithAdminError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function loginAdminAction(formData: FormData) {
  const parsed = loginAdminSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithAdminError(
      "/admin/entrar",
      parsed.error.errors[0]?.message ?? "Dados inválidos"
    );
  }

  const provider = await prisma.provider.findUnique({
    where: { email: parsed.data.email },
  });

  if (!provider || provider.role !== UserRole.ADMIN) {
    redirectWithAdminError("/admin/entrar", "Credenciais inválidas");
  }

  const valid = await bcrypt.compare(parsed.data.password, provider.passwordHash);

  if (!valid) {
    redirectWithAdminError("/admin/entrar", "Credenciais inválidas");
  }

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, provider.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/admin");
}

export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.delete(PROVIDER_SESSION_COOKIE);
  redirect("/admin/entrar");
}

export async function moderateAdvertisementAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");
  const advertisementId = formData.get("advertisementId");
  const status = formData.get("status");

  if (typeof advertisementId !== "string" || typeof status !== "string") {
    redirect("/admin/anuncios");
  }

  try {
    await updateAdvertisementStatusAsAdmin({
      adminId: admin.id,
      advertisementId,
      status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar o anúncio";
    redirect(`/admin/anuncios?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/anuncios");
  revalidatePath("/admin");
  revalidatePath("/buscar");
  revalidatePath("/");

  redirect("/admin/anuncios?saved=1");
}

export async function adminDeleteAdvertisementAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");
  const advertisementId = formData.get("advertisementId");

  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/admin/anuncios");
  }

  try {
    await deleteAdvertisementAsAdmin({
      adminId: admin.id,
      advertisementId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível excluir o anúncio";
    redirect(`/admin/anuncios?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/anuncios");
  revalidatePath("/admin");
  revalidatePath("/buscar");
  revalidatePath("/");

  redirect("/admin/anuncios?deleted=1");
}

export async function updateReportStatusAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");
  const reportId = formData.get("reportId");
  const status = formData.get("status");

  if (typeof reportId !== "string" || typeof status !== "string") {
    redirect("/admin/denuncias");
  }

  try {
    await updateReportStatusAsAdmin({
      adminId: admin.id,
      reportId,
      status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar a denúncia";
    redirect(`/admin/denuncias?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/denuncias");
  revalidatePath("/admin");

  redirect("/admin/denuncias?saved=1");
}

export async function moderateProviderAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const providerId = formData.get("providerId");
  const status = formData.get("status");

  if (typeof providerId !== "string" || typeof status !== "string") {
    redirect("/admin/usuarios");
  }

  try {
    await updateProviderStatusAsAdmin({
      adminId: admin.id,
      providerId,
      status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar o usuário";
    redirect(`/admin/usuarios?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  revalidatePath("/buscar");
  revalidatePath("/");

  redirect("/admin/usuarios?saved=1");
}

export async function adminDeleteProviderAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const providerId = formData.get("providerId");

  if (typeof providerId !== "string" || !providerId) {
    redirect("/admin/usuarios");
  }

  try {
    await deleteProviderAsAdmin({
      adminId: admin.id,
      providerId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível excluir o usuário";
    redirect(`/admin/usuarios?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/anuncios");
  revalidatePath("/admin");
  revalidatePath("/buscar");
  revalidatePath("/");

  redirect("/admin/usuarios?deleted=1");
}

export async function submitReportAction(formData: FormData) {
  const advertisementRef = formData.get("advertisementRef");
  const reason = formData.get("reason");
  const details = formData.get("details");

  if (
    typeof advertisementRef !== "string" ||
    !advertisementRef.trim() ||
    typeof reason !== "string" ||
    !reason.trim()
  ) {
    redirect("/denunciar?error=Dados inválidos");
  }

  await createReport({
    advertisementRef: advertisementRef.trim(),
    reason: reason.trim(),
    details:
      typeof details === "string" && details.trim().length > 0
        ? details.trim()
        : undefined,
  });

  redirect("/denunciar?sent=1");
}

export async function updateHomepageSettingsAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  await updateHomepageSettings({
    showUrgentSearches: formData.get("showUrgentSearches") === "on",
    showPopularCategories: formData.get("showPopularCategories") === "on",
    showCityExplorer: formData.get("showCityExplorer") === "on",
  });

  revalidatePath("/");
  revalidatePath("/admin/home");
  redirect("/admin/home?saved=1");
}

export async function adminRegisterSubscriptionAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const providerId = formData.get("providerId");
  const notesRaw = formData.get("notes");

  if (typeof providerId !== "string" || !providerId) {
    redirect("/admin/usuarios");
  }

  try {
    const method = parseManualPaymentMethod(formData.get("method"));
    const notes =
      typeof notesRaw === "string" && notesRaw.trim().length > 0
        ? notesRaw.trim().slice(0, 200)
        : undefined;

    await registerManualSubscriptionAsAdmin({
      adminId: admin.id,
      providerId,
      method,
      notes,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível registrar a assinatura";
    redirect(`/admin/usuarios?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/pagamentos");
  revalidatePath("/admin");
  revalidatePath("/painel");
  revalidatePath("/painel/assinatura");

  redirect("/admin/usuarios?saved=1&manual=subscription");
}

export async function adminRegisterPremiumBoostAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const advertisementId = formData.get("advertisementId");
  const notesRaw = formData.get("notes");

  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/admin/anuncios");
  }

  try {
    const method = parseManualPaymentMethod(formData.get("method"));
    const notes =
      typeof notesRaw === "string" && notesRaw.trim().length > 0
        ? notesRaw.trim().slice(0, 200)
        : undefined;

    await registerManualPremiumBoostAsAdmin({
      adminId: admin.id,
      advertisementId,
      method,
      notes,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível registrar o destaque premium";
    redirect(`/admin/anuncios?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/anuncios");
  revalidatePath("/admin/pagamentos");
  revalidatePath("/admin");
  revalidatePath("/painel/anuncios");
  revalidatePath("/buscar");
  revalidatePath("/");

  redirect("/admin/anuncios?saved=1&manual=premium");
}

export async function adminCreateProviderAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = adminCreateProviderSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    password: formData.get("password"),
    grantTrial: formData.get("grantTrial") === "true" ? "true" : "false",
  });

  if (!parsed.success) {
    redirect(
      `/admin/usuarios?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await createProviderAsAdmin({
      adminId: admin.id,
      name: parsed.data.name,
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp,
      passwordHash,
      grantTrial: parsed.data.grantTrial,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível criar o usuário";
    redirect(`/admin/usuarios?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  redirect("/admin/usuarios?saved=1&manual=created");
}

export async function adminResetProviderPasswordAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = adminResetProviderPasswordSchema.safeParse({
    providerId: formData.get("providerId"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/usuarios?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await resetProviderPasswordAsAdmin({
      adminId: admin.id,
      providerId: parsed.data.providerId,
      passwordHash,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível redefinir a senha";
    redirect(`/admin/usuarios?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?saved=1&manual=password");
}

export async function adminCreateAdvertisementAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const providerId = formData.get("providerId");
  const redirectBase =
    typeof providerId === "string" && providerId
      ? `/admin/usuarios`
      : "/admin/usuarios";

  const parsed = adminCreateAdvertisementSchema.safeParse({
    providerId: formData.get("providerId"),
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    category: formData.get("category"),
    customCategory: formData.get("customCategory"),
    city: formData.get("city"),
    state: formData.get("state"),
    neighborhood: formData.get("neighborhood") || undefined,
    whatsappNumber: formData.get("whatsappNumber"),
  });

  if (!parsed.success) {
    redirect(
      `${redirectBase}?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  let advertisementId: string;

  try {
    const advertisement = await createAdvertisementAsAdmin({
      adminId: admin.id,
      providerId: parsed.data.providerId,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      category: parsed.data.category,
      customCategory: parsed.data.customCategory,
      city: parsed.data.city,
      state: parsed.data.state,
      neighborhood: parsed.data.neighborhood,
      whatsappNumber: parsed.data.whatsappNumber,
    });
    advertisementId = advertisement.id;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível criar o anúncio";
    redirect(`${redirectBase}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/anuncios");
  revalidatePath("/admin");
  revalidatePath("/buscar");
  revalidatePath("/");
  revalidatePath(`/anuncio/${advertisementId}`);

  redirect(
    `/admin/usuarios?saved=1&manual=ad&adId=${encodeURIComponent(advertisementId)}`
  );
}

