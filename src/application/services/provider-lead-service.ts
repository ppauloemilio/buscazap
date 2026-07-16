import { ProviderLeadStatus } from "@/domain/enums";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";
import { markDataFetchDynamic } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import type { CreateProviderLeadInput } from "@/schemas/provider-schemas";

const DUPLICATE_WINDOW_HOURS = 24;

export async function createProviderLead(
  input: CreateProviderLeadInput & { readonly photoUrl?: string }
) {
  const since = new Date();
  since.setHours(since.getHours() - DUPLICATE_WINDOW_HOURS);

  const recent = await prisma.providerLead.findFirst({
    where: {
      whatsapp: input.whatsapp,
      createdAt: { gte: since },
      status: {
        in: [ProviderLeadStatus.NEW, ProviderLeadStatus.CONTACTED],
      },
    },
    select: { id: true },
  });

  if (recent) {
    throw new Error(
      "Já recebemos seu interesse recentemente. Em breve falamos no WhatsApp."
    );
  }

  return prisma.providerLead.create({
    data: {
      name: input.name,
      whatsapp: input.whatsapp,
      city: input.city,
      state: input.state,
      neighborhood: input.neighborhood,
      serviceArea: input.serviceArea,
      adTitle: input.adTitle,
      description: input.description,
      photoUrl: input.photoUrl,
      status: ProviderLeadStatus.NEW,
    },
  });
}

export async function listProviderLeads(status?: string) {
  markDataFetchDynamic();

  return prisma.providerLead.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function countNewProviderLeads() {
  markDataFetchDynamic();

  return prisma.providerLead.count({
    where: { status: ProviderLeadStatus.NEW },
  });
}

export async function updateProviderLeadStatus(input: {
  readonly leadId: string;
  readonly status: ProviderLeadStatus;
  readonly notes?: string;
}) {
  const existing = await prisma.providerLead.findUnique({
    where: { id: input.leadId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Lead não encontrado");
  }

  return prisma.providerLead.update({
    where: { id: input.leadId },
    data: {
      status: input.status,
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
    },
  });
}

export function resolveLeadPhotoUrl(photoUrl: string | null | undefined) {
  if (!photoUrl) return null;
  return resolveAdvertisementImageUrl(photoUrl);
}
