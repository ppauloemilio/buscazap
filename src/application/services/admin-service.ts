import {
  AdvertisementStatus,
  AdvertisementType,
  PaymentStatus,
  ProviderStatus,
  ServiceArea,
  UserRole,
} from "@/domain/enums";
import { PRICING } from "@/config/pricing";
import { ADVERTISEMENT_IMAGE_KIND } from "@/config/advertisement-images";
import { createAdvertisement } from "@/application/services/advertisement-service";
import {
  registerCategorySuggestion,
  resolveAdvertisementCategoryFromCatalog,
} from "@/application/services/category-matching-service";
import { generateUniqueReferralCode } from "@/application/services/referral-service";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";
import { prisma } from "@/lib/prisma";
import {
  canProviderPublish,
  hasActiveSubscription,
  isPremiumActive,
} from "@/lib/provider-session";
import { normalizeWhatsAppIdentity } from "@/lib/whatsapp";

const PUBLIC_AD_STATUSES = [AdvertisementStatus.APPROVED] as const;

export async function logAdminAction(input: {
  readonly adminId: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string;
  readonly metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

export async function getAdminDashboardStats() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [
    providersCount,
    advertisementsCount,
    premiumActiveCount,
    openReportsCount,
    paidPayments,
    blockedProvidersCount,
    expiredSubscriptionsCount,
    providersLast7Days,
    referralsLast7Days,
    paidSubscriptionsCount,
    trialActiveCount,
    adsByCity,
    pendingCategorySuggestions,
  ] = await Promise.all([
    prisma.provider.count({ where: { role: UserRole.PROVIDER } }),
    prisma.advertisement.count(),
    prisma.advertisement.count({
      where: {
        premiumExpiresAt: { gt: now },
        status: AdvertisementStatus.APPROVED,
      },
    }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.provider.count({
      where: { role: UserRole.PROVIDER, status: ProviderStatus.BLOCKED },
    }),
    prisma.provider.count({
      where: {
        role: UserRole.PROVIDER,
        subscriptionExpiresAt: {
          not: null,
          lte: now,
        },
      },
    }),
    prisma.provider.count({
      where: {
        role: UserRole.PROVIDER,
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.referral.count({
      where: { createdAt: { gte: weekAgo } },
    }),
    prisma.provider.count({
      where: {
        role: UserRole.PROVIDER,
        status: ProviderStatus.ACTIVE,
        subscriptionExpiresAt: { gt: now },
        subscriptions: { some: {} },
      },
    }),
    prisma.provider.count({
      where: {
        role: UserRole.PROVIDER,
        status: ProviderStatus.ACTIVE,
        subscriptionExpiresAt: { gt: now },
        subscriptions: { none: {} },
      },
    }),
    prisma.advertisement.groupBy({
      by: ["city"],
      where: { status: AdvertisementStatus.APPROVED },
      _count: { _all: true },
    }),
    prisma.categorySuggestion.count({ where: { status: "PENDING" } }),
  ]);

  const activeSubscriptions = await prisma.provider.count({
    where: {
      role: UserRole.PROVIDER,
      status: ProviderStatus.ACTIVE,
      subscriptionExpiresAt: { gt: now },
    },
  });

  const signupsLast30Days = await prisma.provider.count({
    where: {
      role: UserRole.PROVIDER,
      createdAt: { gte: monthAgo },
    },
  });

  return {
    providersCount,
    advertisementsCount,
    premiumActiveCount,
    openReportsCount,
    paidPayments,
    activeSubscriptions,
    blockedProvidersCount,
    expiredSubscriptionsCount,
    providersLast7Days,
    referralsLast7Days,
    paidSubscriptionsCount,
    trialActiveCount,
    signupsLast30Days,
    pendingCategorySuggestions,
    adsByCity: adsByCity
      .map((row) => ({
        city: row.city,
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}

export async function listAdminProviders(filters?: {
  readonly status?: string;
  readonly subscription?: string;
}) {
  const now = new Date();

  const providers = await prisma.provider.findMany({
    where: {
      role: UserRole.PROVIDER,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.subscription === "expired"
        ? {
            subscriptionExpiresAt: {
              not: null,
              lte: now,
            },
          }
        : {}),
      ...(filters?.subscription === "active"
        ? {
            subscriptionExpiresAt: {
              gt: now,
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        select: { status: true },
      },
      _count: {
        select: { advertisements: true },
      },
    },
  });

  return providers.map((provider) => {
    const paymentsPaid = provider.payments.filter(
      (payment) => payment.status === PaymentStatus.PAID
    ).length;
    const paymentsPending = provider.payments.filter(
      (payment) => payment.status === PaymentStatus.PENDING
    ).length;
    const paymentsCancelled = provider.payments.filter(
      (payment) =>
        payment.status === PaymentStatus.CANCELLED ||
        payment.status === PaymentStatus.EXPIRED
    ).length;

    const subscriptionActive = hasActiveSubscription(provider.subscriptionExpiresAt);
    const hadSubscription = provider.subscriptionExpiresAt !== null;

    return {
      id: provider.id,
      name: provider.name,
      email: provider.email,
      whatsapp: provider.whatsapp,
      status: provider.status,
      city: provider.city,
      state: provider.state,
      subscriptionActive,
      subscriptionExpired: hadSubscription && !subscriptionActive,
      hadSubscription,
      subscriptionExpiresAt: provider.subscriptionExpiresAt,
      advertisementsCount: provider._count.advertisements,
      paymentsCount: provider.payments.length,
      paymentsPaid,
      paymentsPending,
      paymentsCancelled,
      createdAt: provider.createdAt,
    };
  });
}

export async function updateProviderStatusAsAdmin(input: {
  readonly adminId: string;
  readonly providerId: string;
  readonly status: string;
}) {
  if (![ProviderStatus.ACTIVE, ProviderStatus.BLOCKED].includes(input.status as ProviderStatus)) {
    throw new Error("Status inválido");
  }

  const provider = await prisma.provider.findUnique({
    where: { id: input.providerId },
  });

  if (!provider) {
    throw new Error("Usuário não encontrado");
  }

  if (provider.role === UserRole.ADMIN) {
    throw new Error("Não é possível alterar administradores");
  }

  if (provider.id === input.adminId) {
    throw new Error("Você não pode alterar sua própria conta");
  }

  const updated = await prisma.provider.update({
    where: { id: input.providerId },
    data: { status: input.status },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "UPDATE_PROVIDER_STATUS",
    entityType: "Provider",
    entityId: updated.id,
    metadata: {
      status: input.status,
      email: updated.email,
      name: updated.name,
    },
  });

  return updated;
}

export async function createProviderAsAdmin(input: {
  readonly adminId: string;
  readonly name: string;
  readonly whatsapp: string;
  readonly email: string | null;
  readonly passwordHash: string;
  readonly grantTrial: boolean;
}) {
  const existingWhatsapp = await prisma.provider.findUnique({
    where: { whatsapp: input.whatsapp },
    select: { id: true },
  });
  if (existingWhatsapp) {
    throw new Error("WhatsApp já cadastrado");
  }

  if (input.email) {
    const existingEmail = await prisma.provider.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existingEmail) {
      throw new Error("E-mail já cadastrado");
    }
  }

  const referralCode = await generateUniqueReferralCode();
  let subscriptionExpiresAt: Date | null = null;
  if (input.grantTrial) {
    subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setDate(
      subscriptionExpiresAt.getDate() + PRICING.LAUNCH_TRIAL_DAYS
    );
  }

  const provider = await prisma.provider.create({
    data: {
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp,
      passwordHash: input.passwordHash,
      role: UserRole.PROVIDER,
      referralCode,
      subscriptionExpiresAt,
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "CREATE_PROVIDER",
    entityType: "Provider",
    entityId: provider.id,
    metadata: {
      name: provider.name,
      email: provider.email,
      whatsapp: provider.whatsapp,
      grantTrial: input.grantTrial,
    },
  });

  return provider;
}

export async function resetProviderPasswordAsAdmin(input: {
  readonly adminId: string;
  readonly providerId: string;
  readonly passwordHash: string;
}) {
  const provider = await prisma.provider.findUnique({
    where: { id: input.providerId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!provider) {
    throw new Error("Usuário não encontrado");
  }

  if (provider.role === UserRole.ADMIN) {
    throw new Error("Não é possível redefinir senha de administradores por aqui");
  }

  await prisma.provider.update({
    where: { id: input.providerId },
    data: { passwordHash: input.passwordHash },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "RESET_PROVIDER_PASSWORD",
    entityType: "Provider",
    entityId: provider.id,
    metadata: {
      name: provider.name,
      email: provider.email,
    },
  });
}

export async function createAdvertisementAsAdmin(input: {
  readonly adminId: string;
  readonly providerId: string;
  readonly title: string;
  readonly description: string;
  readonly type: AdvertisementType;
  readonly category: string;
  readonly customCategory?: string;
  readonly city: string;
  readonly state: string;
  readonly neighborhood?: string;
  readonly serviceArea?: ServiceArea;
  readonly whatsappNumber?: string;
}) {
  const provider = await prisma.provider.findUnique({
    where: { id: input.providerId },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      role: true,
      status: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!provider) {
    throw new Error("Anunciante não encontrado");
  }

  if (provider.role === UserRole.ADMIN) {
    throw new Error("Não é possível criar anúncio para administrador");
  }

  if (provider.status === ProviderStatus.BLOCKED) {
    throw new Error("Anunciante bloqueado — reative antes de criar anúncio");
  }

  if (!canProviderPublish(provider)) {
    throw new Error(
      "Anunciante sem assinatura/trial ativo. Ative o trial ou registre a assinatura antes."
    );
  }

  const whatsappNumber =
    normalizeWhatsAppIdentity(input.whatsappNumber ?? "") ??
    normalizeWhatsAppIdentity(provider.whatsapp) ??
    provider.whatsapp;

  const categoryResolution = await resolveAdvertisementCategoryFromCatalog({
    category: input.category,
    customCategory: input.customCategory,
  });

  if (categoryResolution.isCustomCategory) {
    await registerCategorySuggestion(categoryResolution.categoryName);
  }

  const result = await createAdvertisement({
    providerId: provider.id,
    title: input.title,
    description: input.description,
    type: input.type,
    category: categoryResolution.categoryName,
    isCustomCategory: categoryResolution.isCustomCategory,
    city: input.city,
    state: input.state,
    neighborhood: input.neighborhood,
    serviceArea: input.serviceArea,
    whatsappNumber,
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "CREATE_ADVERTISEMENT_FOR_PROVIDER",
    entityType: "Advertisement",
    entityId: result.advertisement.id,
    metadata: {
      providerId: provider.id,
      providerName: provider.name,
      title: input.title,
      category: categoryResolution.categoryName,
      city: input.city,
      state: input.state,
    },
  });

  return result.advertisement;
}

export async function findAdvertisementForAdminEdit(advertisementId: string) {
  const advertisement = await prisma.advertisement.findUnique({
    where: { id: advertisementId },
    include: {
      provider: {
        select: { id: true, name: true, whatsapp: true },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!advertisement) {
    return null;
  }

  const cover = advertisement.images.find(
    (image) => image.kind === ADVERTISEMENT_IMAGE_KIND.COVER
  );

  return {
    id: advertisement.id,
    title: advertisement.title,
    description: advertisement.description,
    type: advertisement.type,
    category: advertisement.category,
    isCustomCategory: advertisement.isCustomCategory,
    city: advertisement.city,
    state: advertisement.state,
    neighborhood: advertisement.neighborhood,
    serviceArea: advertisement.serviceArea,
    whatsappNumber: advertisement.whatsappNumber,
    status: advertisement.status,
    provider: advertisement.provider,
    coverImageUrl: cover ? resolveAdvertisementImageUrl(cover.url) : null,
  };
}

export async function updateAdvertisementAsAdmin(input: {
  readonly adminId: string;
  readonly advertisementId: string;
  readonly title: string;
  readonly description: string;
  readonly type: AdvertisementType;
  readonly category: string;
  readonly customCategory?: string;
  readonly city: string;
  readonly state: string;
  readonly neighborhood?: string;
  readonly serviceArea?: ServiceArea;
  readonly whatsappNumber: string;
}) {
  const existing = await prisma.advertisement.findUnique({
    where: { id: input.advertisementId },
    select: { id: true, providerId: true, title: true },
  });

  if (!existing) {
    throw new Error("Anúncio não encontrado");
  }

  const whatsappNumber =
    normalizeWhatsAppIdentity(input.whatsappNumber) ?? input.whatsappNumber;

  const categoryResolution = await resolveAdvertisementCategoryFromCatalog({
    category: input.category,
    customCategory: input.customCategory,
  });

  if (categoryResolution.isCustomCategory) {
    await registerCategorySuggestion(categoryResolution.categoryName);
  }

  const updated = await prisma.advertisement.update({
    where: { id: input.advertisementId },
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      category: categoryResolution.categoryName,
      isCustomCategory: categoryResolution.isCustomCategory,
      city: input.city,
      state: input.state,
      neighborhood: input.neighborhood || null,
      serviceArea: input.serviceArea,
      whatsappNumber,
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "UPDATE_ADVERTISEMENT",
    entityType: "Advertisement",
    entityId: updated.id,
    metadata: {
      providerId: existing.providerId,
      title: updated.title,
      category: categoryResolution.categoryName,
      city: updated.city,
      state: updated.state,
    },
  });

  return updated;
}

export async function deleteProviderAsAdmin(input: {
  readonly adminId: string;
  readonly providerId: string;
}) {
  const provider = await prisma.provider.findUnique({
    where: { id: input.providerId },
    include: {
      _count: {
        select: { advertisements: true, payments: true },
      },
    },
  });

  if (!provider) {
    throw new Error("Usuário não encontrado");
  }

  if (provider.role === UserRole.ADMIN) {
    throw new Error("Não é possível excluir administradores");
  }

  if (provider.id === input.adminId) {
    throw new Error("Você não pode excluir sua própria conta");
  }

  await prisma.provider.delete({
    where: { id: input.providerId },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "DELETE_PROVIDER",
    entityType: "Provider",
    entityId: provider.id,
    metadata: {
      email: provider.email,
      name: provider.name,
      advertisementsCount: provider._count.advertisements,
      paymentsCount: provider._count.payments,
    },
  });
}

export async function listAdminAdvertisements(filters?: {
  readonly status?: string;
  readonly premium?: boolean;
  readonly providerId?: string;
}) {
  const advertisements = await prisma.advertisement.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.providerId ? { providerId: filters.providerId } : {}),
      ...(filters?.premium
        ? { premiumExpiresAt: { gt: new Date() } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          whatsapp: true,
        },
      },
      premiumBoosts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          amount: true,
          expiresAt: true,
          startsAt: true,
        },
      },
    },
  });

  return advertisements.map((ad) => ({
    id: ad.id,
    title: ad.title,
    category: ad.category,
    city: ad.city,
    state: ad.state,
    status: ad.status,
    premiumActive: isPremiumActive(ad.premiumExpiresAt),
    premiumExpiresAt: ad.premiumExpiresAt,
    lastBoost: ad.premiumBoosts[0] ?? null,
    provider: ad.provider,
    createdAt: ad.createdAt,
  }));
}

export async function updateAdvertisementStatusAsAdmin(input: {
  readonly adminId: string;
  readonly advertisementId: string;
  readonly status: string;
}) {
  if (!PUBLIC_AD_STATUSES.includes(input.status as (typeof PUBLIC_AD_STATUSES)[number]) &&
      !["PENDING", "REJECTED", "BLOCKED", "INACTIVE"].includes(input.status)) {
    throw new Error("Status inválido");
  }

  const advertisement = await prisma.advertisement.update({
    where: { id: input.advertisementId },
    data: { status: input.status },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "UPDATE_ADVERTISEMENT_STATUS",
    entityType: "Advertisement",
    entityId: advertisement.id,
    metadata: { status: input.status, title: advertisement.title },
  });

  return advertisement;
}

export async function deleteAdvertisementAsAdmin(input: {
  readonly adminId: string;
  readonly advertisementId: string;
}) {
  const advertisement = await prisma.advertisement.findUnique({
    where: { id: input.advertisementId },
  });

  if (!advertisement) {
    throw new Error("Anúncio não encontrado");
  }

  await prisma.advertisement.delete({
    where: { id: input.advertisementId },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "DELETE_ADVERTISEMENT",
    entityType: "Advertisement",
    entityId: advertisement.id,
    metadata: { title: advertisement.title, providerId: advertisement.providerId },
  });
}

export async function listAdminAuditLogs(limit = 50) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      admin: {
        select: { name: true, email: true },
      },
    },
  });
}

export async function listAdminReports(status?: string) {
  return prisma.report.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function updateReportStatusAsAdmin(input: {
  readonly adminId: string;
  readonly reportId: string;
  readonly status: string;
}) {
  if (!["OPEN", "REVIEWED", "DISMISSED"].includes(input.status)) {
    throw new Error("Status inválido");
  }

  const report = await prisma.report.update({
    where: { id: input.reportId },
    data: { status: input.status },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "UPDATE_REPORT_STATUS",
    entityType: "Report",
    entityId: report.id,
    metadata: { status: input.status },
  });

  return report;
}

export async function createReport(input: {
  readonly advertisementRef: string;
  readonly reason: string;
  readonly details?: string;
}) {
  return prisma.report.create({
    data: input,
  });
}

export async function getAdminCategoryStats() {
  const [grouped, catalogCategories] = await Promise.all([
    prisma.advertisement.groupBy({
      by: ["category"],
      _count: { category: true },
      where: { status: AdvertisementStatus.APPROVED },
      orderBy: { _count: { category: "desc" } },
    }),
    prisma.catalogCategory.findMany({
      select: { name: true, slug: true },
    }),
  ]);

  const knownCategories = new Map(
    catalogCategories.map((category) => [category.name, category])
  );

  return grouped.map((item) => ({
    name: item.category,
    slug: knownCategories.get(item.category)?.slug ?? item.category.toLowerCase(),
    advertisementsCount: item._count.category,
    isKnown: knownCategories.has(item.category),
  }));
}

export async function listAdminPayments(limit = 30) {
  return prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      provider: {
        select: { name: true, email: true, whatsapp: true },
      },
    },
  });
}
