"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProviderLead,
  deleteProviderLeadAsAdmin,
  publishProviderLeadAsAdmin,
  updateProviderLeadContent,
  updateProviderLeadStatus,
} from "@/application/services/provider-lead-service";
import { getCurrentAdmin } from "@/lib/admin-session";
import { uploadLeadImage, validateImageFile } from "@/lib/image-upload";
import { prisma } from "@/lib/prisma";
import { buildAbsoluteUrl } from "@/lib/site-url";
import { toLocalWhatsAppDigits } from "@/lib/whatsapp";
import {
  adminDeleteProviderLeadSchema,
  adminEditProviderLeadSchema,
  adminPublishProviderLeadSchema,
  adminUpdateProviderLeadSchema,
  createProviderLeadSchema,
} from "@/schemas/provider-schemas";
import { buildWhatsAppLink } from "@/shared/utils/format";

export async function submitProviderLeadAction(formData: FormData) {
  const parsed = createProviderLeadSchema.safeParse({
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
    whatsappLabel: formData.get("whatsappLabel") || undefined,
    secondaryWhatsapp: formData.get("secondaryWhatsapp") || undefined,
    secondaryWhatsappLabel: formData.get("secondaryWhatsappLabel") || undefined,
    city: formData.get("city"),
    state: formData.get("state") || "PA",
    neighborhood: formData.get("neighborhood"),
    serviceArea: formData.get("serviceArea"),
    adTitle: formData.get("adTitle"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect(
      `/parceiro?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  const photoFile = formData.get("photo");
  if (!(photoFile instanceof File) || photoFile.size === 0) {
    redirect(
      `/parceiro?error=${encodeURIComponent("A foto do anúncio é obrigatória")}`
    );
  }

  const photoError = validateImageFile(photoFile, "Foto");
  if (photoError) {
    redirect(`/parceiro?error=${encodeURIComponent(photoError)}`);
  }

  let leadId: string | null = null;

  try {
    const lead = await createProviderLead(parsed.data);
    leadId = lead.id;

    const photoUrl = await uploadLeadImage(photoFile, lead.id);
    await prisma.providerLead.update({
      where: { id: lead.id },
      data: { photoUrl },
    });
  } catch (error) {
    if (leadId) {
      await prisma.providerLead.delete({ where: { id: leadId } }).catch(() => null);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível enviar seu cadastro. Tente novamente.";
    redirect(`/parceiro?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/leads");
  redirect("/parceiro?sent=1");
}

export async function adminUpdateProviderLeadAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = adminUpdateProviderLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
    notes: formData.has("notes") ? formData.get("notes") : undefined,
  });

  if (!parsed.success) {
    redirect(
      `/admin/leads?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  try {
    await updateProviderLeadStatus({
      leadId: parsed.data.leadId,
      status: parsed.data.status,
      notes: parsed.data.notes,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar o lead";
    redirect(`/admin/leads?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  redirect("/admin/leads?saved=1");
}

export async function adminDeleteProviderLeadAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = adminDeleteProviderLeadSchema.safeParse({
    leadId: formData.get("leadId"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/leads?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Lead inválido")}`
    );
  }

  try {
    await deleteProviderLeadAsAdmin({
      adminId: admin.id,
      leadId: parsed.data.leadId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível excluir o lead";
    redirect(`/admin/leads?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  redirect("/admin/leads?deleted=1");
}

export async function adminEditProviderLeadAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = adminEditProviderLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
    whatsappLabel: formData.get("whatsappLabel") || undefined,
    secondaryWhatsapp: formData.get("secondaryWhatsapp") || undefined,
    secondaryWhatsappLabel: formData.get("secondaryWhatsappLabel") || undefined,
    city: formData.get("city"),
    state: formData.get("state") || "PA",
    neighborhood: formData.get("neighborhood"),
    serviceArea: formData.get("serviceArea"),
    adTitle: formData.get("adTitle"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/leads?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  try {
    const { leadId, ...content } = parsed.data;
    await updateProviderLeadContent({ leadId, ...content });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível editar o lead";
    redirect(`/admin/leads?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  redirect("/admin/leads?saved=1");
}

export async function adminPublishProviderLeadAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = adminPublishProviderLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    type: formData.get("type"),
    category: formData.get("category"),
    customCategory: formData.get("customCategory"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/leads?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Lead inválido")}`
    );
  }

  let result;
  try {
    result = await publishProviderLeadAsAdmin({
      adminId: admin.id,
      leadId: parsed.data.leadId,
      type: parsed.data.type,
      category: parsed.data.category,
      customCategory: parsed.data.customCategory,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível publicar o anúncio";
    redirect(`/admin/leads?error=${encodeURIComponent(message)}`);
  }

  const adUrl = buildAbsoluteUrl(`/anuncio/${result.advertisementId}`);
  const loginDigits = toLocalWhatsAppDigits(result.whatsapp);

  const whatsappMessage = result.temporaryPassword
    ? `Olá ${result.providerName}! Seu anúncio "${result.adTitle}" já está no BuscaZapp: ${adUrl}\n\nPara acessar o painel: ${buildAbsoluteUrl("/entrar")}\nLogin (WhatsApp): ${loginDigits}\nSenha temporária: ${result.temporaryPassword}\n\nTroque a senha no painel quando puder.`
    : `Olá ${result.providerName}! Seu anúncio "${result.adTitle}" já está no BuscaZapp: ${adUrl}`;

  const notifyHref = buildWhatsAppLink(result.whatsapp, whatsappMessage);

  revalidatePath("/admin/leads");
  revalidatePath("/admin/anuncios");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  revalidatePath("/buscar");
  revalidatePath("/");
  revalidatePath(`/anuncio/${result.advertisementId}`);

  redirect(
    `/admin/leads?published=1&adId=${encodeURIComponent(result.advertisementId)}&notify=${encodeURIComponent(notifyHref)}`
  );
}
