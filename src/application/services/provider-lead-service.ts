import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { createAdvertisement } from "@/application/services/advertisement-service";
import { logAdminAction } from "@/application/services/admin-service";
import {
  registerCategorySuggestion,
  resolveAdvertisementCategoryFromCatalog,
} from "@/application/services/category-matching-service";
import { generateUniqueReferralCode } from "@/application/services/referral-service";
import { ADVERTISEMENT_IMAGE_KIND } from "@/config/advertisement-images";
import { PRICING } from "@/config/pricing";
import {
  AdvertisementType,
  ProviderLeadStatus,
  ProviderStatus,
  ServiceArea,
  UserRole,
} from "@/domain/enums";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";
import { markDataFetchDynamic } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import {
  canProviderPublish,
  hasActiveSubscription,
} from "@/lib/provider-session";
import { normalizeWhatsAppIdentity, toLocalWhatsAppDigits } from "@/lib/whatsapp";
import type { CreateProviderLeadInput } from "@/schemas/provider-schemas";

const DUPLICATE_WINDOW_HOURS = 24;

function generateTemporaryPassword(): string {
  return `bz${randomInt(100000, 999999)}`;
}

function parseServiceArea(value: string): ServiceArea {
  if (Object.values(ServiceArea).includes(value as ServiceArea)) {
    return value as ServiceArea;
  }
  return ServiceArea.CITY_WIDE;
}

function buildTrialExpiresAt(from = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + PRICING.LAUNCH_TRIAL_DAYS);
  return expiresAt;
}

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
      whatsappLabel: input.whatsappLabel ?? null,
      secondaryWhatsapp: input.secondaryWhatsapp ?? null,
      secondaryWhatsappLabel: input.secondaryWhatsappLabel ?? null,
      city: input.city,
      state: input.state,
      neighborhood: input.neighborhood ?? null,
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

export async function deleteProviderLeadAsAdmin(input: {
  readonly adminId: string;
  readonly leadId: string;
}) {
  const lead = await prisma.providerLead.findUnique({
    where: { id: input.leadId },
    select: {
      id: true,
      name: true,
      whatsapp: true,
      adTitle: true,
      status: true,
    },
  });

  if (!lead) {
    throw new Error("Lead não encontrado");
  }

  await prisma.providerLead.delete({
    where: { id: input.leadId },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "DELETE_PROVIDER_LEAD",
    entityType: "ProviderLead",
    entityId: lead.id,
    metadata: {
      name: lead.name,
      whatsapp: toLocalWhatsAppDigits(lead.whatsapp),
      adTitle: lead.adTitle,
      status: lead.status,
    },
  });
}

export async function updateProviderLeadContent(
  input: CreateProviderLeadInput & { readonly leadId: string }
) {
  const existing = await prisma.providerLead.findUnique({
    where: { id: input.leadId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error("Lead não encontrado");
  }

  if (
    existing.status !== ProviderLeadStatus.NEW &&
    existing.status !== ProviderLeadStatus.CONTACTED
  ) {
    throw new Error(
      "Só é possível editar leads novos ou contatados (antes de publicar)"
    );
  }

  return prisma.providerLead.update({
    where: { id: input.leadId },
    data: {
      name: input.name,
      whatsapp: input.whatsapp,
      whatsappLabel: input.whatsappLabel ?? null,
      secondaryWhatsapp: input.secondaryWhatsapp ?? null,
      secondaryWhatsappLabel: input.secondaryWhatsappLabel ?? null,
      city: input.city,
      state: input.state,
      neighborhood: input.neighborhood ?? null,
      serviceArea: input.serviceArea,
      adTitle: input.adTitle,
      description: input.description,
    },
  });
}

export function resolveLeadPhotoUrl(photoUrl: string | null | undefined) {
  if (!photoUrl) return null;
  return resolveAdvertisementImageUrl(photoUrl);
}

export async function publishProviderLeadAsAdmin(input: {
  readonly adminId: string;
  readonly leadId: string;
  readonly type: AdvertisementType;
  readonly category: string;
  readonly customCategory?: string;
}) {
  const lead = await prisma.providerLead.findUnique({
    where: { id: input.leadId },
  });

  if (!lead) {
    throw new Error("Lead não encontrado");
  }

  if (lead.status === ProviderLeadStatus.CONVERTED) {
    throw new Error("Este lead já foi publicado");
  }

  if (lead.status === ProviderLeadStatus.DISMISSED) {
    throw new Error("Lead arquivado — desarquive antes de publicar");
  }

  if (!lead.description?.trim() || lead.description.trim().length < 20) {
    throw new Error("Lead sem descrição suficiente para publicar o anúncio");
  }

  const whatsapp =
    normalizeWhatsAppIdentity(lead.whatsapp) ?? lead.whatsapp.replace(/\D/g, "");

  if (!whatsapp) {
    throw new Error("WhatsApp do lead inválido");
  }

  let temporaryPassword: string | null = null;
  let providerCreated = false;

  let provider = await prisma.provider.findUnique({
    where: { whatsapp },
    select: {
      id: true,
      name: true,
      whatsapp: true,
      role: true,
      status: true,
      subscriptionExpiresAt: true,
    },
  });

  if (provider) {
    if (provider.role === UserRole.ADMIN) {
      throw new Error("Este WhatsApp pertence a um administrador");
    }
    if (provider.status === ProviderStatus.BLOCKED) {
      throw new Error("Anunciante bloqueado — reative antes de publicar");
    }

    if (!canProviderPublish(provider)) {
      provider = await prisma.provider.update({
        where: { id: provider.id },
        data: { subscriptionExpiresAt: buildTrialExpiresAt() },
        select: {
          id: true,
          name: true,
          whatsapp: true,
          role: true,
          status: true,
          subscriptionExpiresAt: true,
        },
      });
    }
  } else {
    temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const referralCode = await generateUniqueReferralCode();

    provider = await prisma.provider.create({
      data: {
        name: lead.name,
        whatsapp,
        passwordHash,
        role: UserRole.PROVIDER,
        status: ProviderStatus.ACTIVE,
        city: lead.city,
        state: lead.state,
        neighborhood: lead.neighborhood ?? null,
        referralCode,
        subscriptionExpiresAt: buildTrialExpiresAt(),
      },
      select: {
        id: true,
        name: true,
        whatsapp: true,
        role: true,
        status: true,
        subscriptionExpiresAt: true,
      },
    });
    providerCreated = true;
  }

  if (!hasActiveSubscription(provider.subscriptionExpiresAt)) {
    throw new Error("Não foi possível liberar o trial do anunciante");
  }

  const categoryResolution = await resolveAdvertisementCategoryFromCatalog({
    category: input.category,
    customCategory: input.customCategory,
  });

  if (categoryResolution.isCustomCategory) {
    await registerCategorySuggestion(categoryResolution.categoryName);
  }

  const { advertisement } = await createAdvertisement({
    providerId: provider.id,
    title: lead.adTitle,
    description: (lead.description ?? "").trim() || lead.adTitle,
    type: input.type,
    category: categoryResolution.categoryName,
    isCustomCategory: categoryResolution.isCustomCategory,
    city: lead.city,
    state: lead.state,
    neighborhood: lead.neighborhood ?? undefined,
    serviceArea: parseServiceArea(lead.serviceArea),
    whatsappNumber: whatsapp,
    whatsappLabel: lead.whatsappLabel ?? undefined,
    secondaryWhatsappNumber: lead.secondaryWhatsapp ?? undefined,
    secondaryWhatsappLabel: lead.secondaryWhatsappLabel ?? undefined,
    bypassAdSlotLimit: true,
  });

  if (lead.photoUrl) {
    await prisma.advertisementImage.create({
      data: {
        advertisementId: advertisement.id,
        url: lead.photoUrl,
        kind: ADVERTISEMENT_IMAGE_KIND.COVER,
        sortOrder: 0,
      },
    });
  }

  const publishedNote = [
    `Publicado em ${new Date().toLocaleString("pt-BR")}.`,
    `Anúncio: /anuncio/${advertisement.id}.`,
    providerCreated
      ? `Conta criada. Senha temporária: ${temporaryPassword}.`
      : "Conta já existia — anúncio vinculado.",
  ].join(" ");

  await prisma.providerLead.update({
    where: { id: lead.id },
    data: {
      status: ProviderLeadStatus.CONVERTED,
      notes: lead.notes
        ? `${lead.notes}\n${publishedNote}`
        : publishedNote,
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "PUBLISH_PROVIDER_LEAD",
    entityType: "ProviderLead",
    entityId: lead.id,
    metadata: {
      providerId: provider.id,
      advertisementId: advertisement.id,
      providerCreated,
      whatsapp: toLocalWhatsAppDigits(whatsapp),
      type: input.type,
      category: categoryResolution.categoryName,
    },
  });

  return {
    leadId: lead.id,
    providerId: provider.id,
    advertisementId: advertisement.id,
    providerName: provider.name,
    adTitle: lead.adTitle,
    whatsapp,
    temporaryPassword,
    providerCreated,
  };
}
