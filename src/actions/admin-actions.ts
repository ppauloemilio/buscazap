"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  createReport,
  deleteAdvertisementAsAdmin,
  updateAdvertisementStatusAsAdmin,
  updateReportStatusAsAdmin,
} from "@/application/services/admin-service";
import { PROVIDER_SESSION_COOKIE } from "@/config/pricing";
import { getCurrentAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { loginProviderSchema } from "@/schemas/provider-schemas";
import { UserRole } from "@/domain/enums";

function redirectWithAdminError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function loginAdminAction(formData: FormData) {
  const parsed = loginProviderSchema.safeParse({
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
