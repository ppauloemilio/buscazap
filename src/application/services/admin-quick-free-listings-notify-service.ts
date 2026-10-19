import { logAdminAction } from "@/application/services/admin-service";
import {
  buildClaimUrl,
  issueProviderClaimToken,
} from "@/application/services/provider-claim-service";
import { resolveCategorySlugByName } from "@/application/services/slug-service";
import { buildQuickFreeListingWelcomeWhatsAppHref } from "@/lib/advertisement-notify-message";
import { buildAbsoluteUrl } from "@/lib/site-url";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";

const CREATE_ACTION = "CREATE_QUICK_FREE_LISTING";
const BULK_ACTION = "BULK_CREATE_QUICK_FREE_LISTINGS";
const NOTIFY_ACTION = "QUICK_FREE_WELCOME_NOTIFY";

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function parseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

async function collectQuickFreeAdvertisementIds(since: Date): Promise<{
  readonly ids: string[];
  readonly createdAtById: Map<string, Date>;
}> {
  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: since },
      action: { in: [CREATE_ACTION, BULK_ACTION] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      action: true,
      entityId: true,
      metadata: true,
      createdAt: true,
    },
  });

  const createdAtById = new Map<string, Date>();

  for (const log of logs) {
    if (log.action === CREATE_ACTION && log.entityId) {
      if (!createdAtById.has(log.entityId)) {
        createdAtById.set(log.entityId, log.createdAt);
      }
      continue;
    }

    if (log.action === BULK_ACTION) {
      const metadata = parseMetadata(log.metadata);
      const ids = metadata?.advertisementIds;
      if (!Array.isArray(ids)) continue;
      for (const id of ids) {
        if (typeof id !== "string" || !id.trim()) continue;
        if (!createdAtById.has(id)) {
          createdAtById.set(id, log.createdAt);
        }
      }
    }
  }

  return { ids: [...createdAtById.keys()], createdAtById };
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

async function resolveClaimAndNotifyHref(input: {
  readonly advertisementId: string;
  readonly slug: string | null;
  readonly category: string;
  readonly whatsapp: string;
  readonly providerId: string;
  readonly claimToken: string | null;
  readonly claimVerifiedAt: Date | null;
}): Promise<{ readonly publicHref: string; readonly notifyHref: string }> {
  let claimUrl: string;
  if (input.claimToken?.trim()) {
    claimUrl = buildClaimUrl(input.claimToken.trim());
  } else if (!input.claimVerifiedAt) {
    const issued = await issueProviderClaimToken(input.providerId);
    claimUrl = issued.claimUrl;
  } else {
    claimUrl = buildAbsoluteUrl("/entrar");
  }

  const publicHref = await buildPublicAdUrl({
    advertisementId: input.advertisementId,
    slug: input.slug,
    category: input.category,
  });

  return {
    publicHref,
    notifyHref: buildQuickFreeListingWelcomeWhatsAppHref({
      whatsapp: input.whatsapp,
      adUrl: publicHref,
      claimUrl,
    }),
  };
}

export async function countAdminQuickFreeListings(days = 7): Promise<number> {
  const { ids } = await collectQuickFreeAdvertisementIds(daysAgo(days));
  if (ids.length === 0) return 0;

  return prisma.advertisement.count({
    where: { id: { in: ids } },
  });
}

export type AdminQuickFreeListingNotifyItem = {
  readonly advertisementId: string;
  readonly title: string;
  readonly category: string;
  readonly neighborhood: string | null;
  readonly city: string;
  readonly whatsapp: string;
  readonly whatsappDisplay: string;
  readonly publicHref: string;
  readonly notifyHref: string;
  readonly importedAt: Date;
  readonly alreadyNotified: boolean;
  readonly notifiedAt: Date | null;
  readonly providerName: string;
  readonly claimVerified: boolean;
};

export async function listAdminQuickFreeListingsForNotify(input?: {
  readonly days?: number;
}): Promise<AdminQuickFreeListingNotifyItem[]> {
  const days = input?.days && input.days > 0 ? input.days : 7;
  const { ids, createdAtById } = await collectQuickFreeAdvertisementIds(
    daysAgo(days)
  );
  if (ids.length === 0) return [];

  const [advertisements, notifyLogs] = await Promise.all([
    prisma.advertisement.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        category: true,
        neighborhood: true,
        city: true,
        slug: true,
        whatsappNumber: true,
        provider: {
          select: {
            id: true,
            name: true,
            whatsapp: true,
            claimToken: true,
            claimVerifiedAt: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        action: NOTIFY_ACTION,
        entityType: "Advertisement",
        entityId: { in: ids },
      },
      orderBy: { createdAt: "desc" },
      select: { entityId: true, createdAt: true },
    }),
  ]);

  const notifiedAtById = new Map<string, Date>();
  for (const log of notifyLogs) {
    if (log.entityId && !notifiedAtById.has(log.entityId)) {
      notifiedAtById.set(log.entityId, log.createdAt);
    }
  }

  const items: AdminQuickFreeListingNotifyItem[] = [];

  for (const ad of advertisements) {
    const whatsapp = ad.provider.whatsapp || ad.whatsappNumber;
    const { publicHref, notifyHref } = await resolveClaimAndNotifyHref({
      advertisementId: ad.id,
      slug: ad.slug,
      category: ad.category,
      whatsapp,
      providerId: ad.provider.id,
      claimToken: ad.provider.claimToken,
      claimVerifiedAt: ad.provider.claimVerifiedAt,
    });

    const notifiedAt = notifiedAtById.get(ad.id) ?? null;

    items.push({
      advertisementId: ad.id,
      title: ad.title,
      category: ad.category,
      neighborhood: ad.neighborhood,
      city: ad.city,
      whatsapp,
      whatsappDisplay: formatWhatsAppDisplay(whatsapp),
      publicHref,
      notifyHref,
      importedAt: createdAtById.get(ad.id) ?? new Date(),
      alreadyNotified: Boolean(notifiedAt),
      notifiedAt,
      providerName: ad.provider.name,
      claimVerified: Boolean(ad.provider.claimVerifiedAt),
    });
  }

  items.sort((a, b) => b.importedAt.getTime() - a.importedAt.getTime());
  return items;
}

export async function markQuickFreeListingWelcomeNotified(input: {
  readonly adminId: string;
  readonly advertisementId: string;
}): Promise<{ readonly notifyHref: string }> {
  const ad = await prisma.advertisement.findUnique({
    where: { id: input.advertisementId },
    select: {
      id: true,
      title: true,
      category: true,
      slug: true,
      whatsappNumber: true,
      provider: {
        select: {
          id: true,
          whatsapp: true,
          claimToken: true,
          claimVerifiedAt: true,
        },
      },
    },
  });

  if (!ad) {
    throw new Error("Anúncio não encontrado");
  }

  const whatsapp = ad.provider.whatsapp || ad.whatsappNumber;
  const { notifyHref } = await resolveClaimAndNotifyHref({
    advertisementId: ad.id,
    slug: ad.slug,
    category: ad.category,
    whatsapp,
    providerId: ad.provider.id,
    claimToken: ad.provider.claimToken,
    claimVerifiedAt: ad.provider.claimVerifiedAt,
  });

  await logAdminAction({
    adminId: input.adminId,
    action: NOTIFY_ACTION,
    entityType: "Advertisement",
    entityId: ad.id,
    metadata: {
      title: ad.title,
      whatsapp,
    },
  });

  return { notifyHref };
}
