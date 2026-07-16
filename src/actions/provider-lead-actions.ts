"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProviderLead,
  updateProviderLeadStatus,
} from "@/application/services/provider-lead-service";
import { getCurrentAdmin } from "@/lib/admin-session";
import { uploadLeadImage, validateImageFile } from "@/lib/image-upload";
import { prisma } from "@/lib/prisma";
import {
  adminUpdateProviderLeadSchema,
  createProviderLeadSchema,
} from "@/schemas/provider-schemas";

export async function submitProviderLeadAction(formData: FormData) {
  const parsed = createProviderLeadSchema.safeParse({
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
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
