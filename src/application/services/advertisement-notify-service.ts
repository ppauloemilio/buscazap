import bcrypt from "bcryptjs";
import { logAdminAction, resetProviderPasswordAsAdmin } from "@/application/services/admin-service";
import { resolveCategorySlugByName } from "@/application/services/slug-service";
import { ProviderLeadStatus } from "@/domain/enums";
import {
  buildAdvertisementNotifyWhatsAppHref,
  type AdvertisementNotifyMessageInput,
} from "@/lib/advertisement-notify-message";
import { buildAbsoluteUrl } from "@/lib/site-url";
import { generateTemporaryPassword } from "@/lib/temporary-password";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppIdentity } from "@/lib/whatsapp";

export function parseTemporaryPasswordFromLeadNotes(
  notes: string | null | undefined
): string | null {
  if (!notes?.trim()) {
    return null;
  }

  const match = notes.match(/Senha tempor[aá]ria:\s*(\S+?)(?:\.|\s|$)/i);
  return match?.[1] ?? null;
}

async function findConvertedLeadForAdvertisement(input: {
  readonly advertisementId: string;
  readonly providerWhatsapp: string;
}) {
  const normalizedWhatsapp = normalizeWhatsAppIdentity(input.providerWhatsapp);
  if (!normalizedWhatsapp) {
    return null;
  }

  const leads = await prisma.providerLead.findMany({
    where: {
      status: ProviderLeadStatus.CONVERTED,
      OR: [
        { notes: { contains: input.advertisementId } },
        { notes: { contains: `/anuncio/${input.advertisementId}` } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      notes: true,
      whatsapp: true,
    },
  });

  const matched =
    leads.find(
      (lead) => normalizeWhatsAppIdentity(lead.whatsapp) === normalizedWhatsapp
    ) ?? leads[0];

  return matched ?? null;
}

async function buildPublicAdUrl(input: {
  readonly advertisementId: string;
  readonly slug: string | null;
  readonly category: string;
}): Promise<string> {
  if (input.slug?.trim()) {
    const categorySlug = await resolveCategorySlugByName(input.category);
    return buildAbsoluteUrl(`/${categorySlug}/${input.slug.trim()}`);
  }

  return buildAbsoluteUrl(`/anuncio/${input.advertisementId}`);
}

export async function resolveAdvertisementNotifyContext(
  advertisementId: string
): Promise<AdvertisementNotifyMessageInput & {
  readonly advertisementId: string;
  readonly hasStoredPassword: boolean;
  readonly notifyHref: string;
}> {
  const advertisement = await prisma.advertisement.findUnique({
    where: { id: advertisementId },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      whatsappNumber: true,
      provider: {
        select: {
          id: true,
          name: true,
          whatsapp: true,
        },
      },
    },
  });

  if (!advertisement) {
    throw new Error("Anúncio não encontrado");
  }

  const lead = await findConvertedLeadForAdvertisement({
    advertisementId: advertisement.id,
    providerWhatsapp: advertisement.provider.whatsapp,
  });

  const temporaryPassword = parseTemporaryPasswordFromLeadNotes(lead?.notes);
  const adUrl = await buildPublicAdUrl({
    advertisementId: advertisement.id,
    slug: advertisement.slug,
    category: advertisement.category,
  });

  const messageInput: AdvertisementNotifyMessageInput = {
    providerName: advertisement.provider.name,
    adTitle: advertisement.title,
    whatsapp: advertisement.provider.whatsapp,
    adUrl,
    temporaryPassword,
  };

  return {
    advertisementId: advertisement.id,
    ...messageInput,
    hasStoredPassword: Boolean(temporaryPassword),
    notifyHref: buildAdvertisementNotifyWhatsAppHref(messageInput),
  };
}

export async function resolveAdvertisementNotifyContexts(
  advertisementIds: readonly string[]
): Promise<Map<string, Awaited<ReturnType<typeof resolveAdvertisementNotifyContext>>>> {
  const entries = await Promise.all(
    advertisementIds.map(async (id) => {
      try {
        const context = await resolveAdvertisementNotifyContext(id);
        return [id, context] as const;
      } catch {
        return null;
      }
    })
  );

  return new Map(
    entries.filter((entry): entry is readonly [string, Awaited<ReturnType<typeof resolveAdvertisementNotifyContext>>] =>
      entry !== null
    )
  );
}

export async function resetAdvertisementProviderPasswordForNotify(input: {
  readonly adminId: string;
  readonly advertisementId: string;
}): Promise<
  Awaited<ReturnType<typeof resolveAdvertisementNotifyContext>> & {
    readonly temporaryPassword: string;
  }
> {
  const advertisement = await prisma.advertisement.findUnique({
    where: { id: input.advertisementId },
    select: {
      id: true,
      title: true,
      provider: {
        select: { id: true, name: true, whatsapp: true },
      },
    },
  });

  if (!advertisement) {
    throw new Error("Anúncio não encontrado");
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  await resetProviderPasswordAsAdmin({
    adminId: input.adminId,
    providerId: advertisement.provider.id,
    passwordHash,
  });

  const lead = await findConvertedLeadForAdvertisement({
    advertisementId: advertisement.id,
    providerWhatsapp: advertisement.provider.whatsapp,
  });

  if (lead) {
    const passwordNote = `Senha temporária: ${temporaryPassword}.`;
    const appendedNote = `Senha redefinida em ${new Date().toLocaleString("pt-BR")}. ${passwordNote}`;

    await prisma.providerLead.update({
      where: { id: lead.id },
      data: {
        notes: lead.notes
          ? `${lead.notes}\n${appendedNote}`
          : appendedNote,
      },
    });
  }

  await logAdminAction({
    adminId: input.adminId,
    action: "RESET_PASSWORD_FOR_AD_NOTIFY",
    entityType: "Advertisement",
    entityId: advertisement.id,
    metadata: {
      providerId: advertisement.provider.id,
      title: advertisement.title,
    },
  });

  const context = await resolveAdvertisementNotifyContext(input.advertisementId);

  return {
    ...context,
    temporaryPassword,
    hasStoredPassword: true,
    notifyHref: buildAdvertisementNotifyWhatsAppHref({
      ...context,
      temporaryPassword,
    }),
  };
}
