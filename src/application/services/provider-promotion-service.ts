import { PRICING } from "@/config/pricing";
import { canUsePlusFeatures } from "@/lib/plus-plan";
import { prisma } from "@/lib/prisma";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";
export { isPromotionPubliclyActive } from "@/shared/utils/promotion";

export type ProviderPromotionRecord = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly priceOriginal: number;
  readonly pricePromo: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly isEnabled: boolean;
  readonly sortOrder: number;
};

function mapPromotion(row: {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  priceOriginal: number;
  pricePromo: number;
  startsAt: Date;
  endsAt: Date;
  isEnabled: boolean;
  sortOrder: number;
}): ProviderPromotionRecord {
  return {
    ...row,
    imageUrl: row.imageUrl ? resolveAdvertisementImageUrl(row.imageUrl) : null,
  };
}

/** Desliga promoções cujo fim já passou. */
export async function expireProviderPromotions(providerId?: string) {
  const now = new Date();
  await prisma.providerPromotion.updateMany({
    where: {
      ...(providerId ? { providerId } : {}),
      isEnabled: true,
      endsAt: { lt: now },
    },
    data: { isEnabled: false },
  });
}

export async function listProviderPromotionsForPanel(providerId: string) {
  await expireProviderPromotions(providerId);

  const rows = await prisma.providerPromotion.findMany({
    where: { providerId },
    orderBy: { sortOrder: "asc" },
  });

  return rows.map(mapPromotion);
}

export async function listActivePromotionsForProvider(providerId: string) {
  await expireProviderPromotions(providerId);

  const now = new Date();
  const rows = await prisma.providerPromotion.findMany({
    where: {
      providerId,
      isEnabled: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: { sortOrder: "asc" },
  });

  return rows.map(mapPromotion);
}

export async function getProviderIdsWithActivePromotions(
  providerIds: readonly string[]
): Promise<Set<string>> {
  if (providerIds.length === 0) {
    return new Set();
  }

  await expireProviderPromotions();

  const now = new Date();
  const grouped = await prisma.providerPromotion.groupBy({
    by: ["providerId"],
    where: {
      providerId: { in: [...providerIds] },
      isEnabled: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
  });

  return new Set(grouped.map((row) => row.providerId));
}

async function requirePlusProvider(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      role: true,
      status: true,
      subscriptionExpiresAt: true,
      subscriptionTier: true,
    },
  });

  if (!provider || provider.status === "BLOCKED") {
    throw new Error("Conta bloqueada ou inválida");
  }

  if (!(await canUsePlusFeatures(provider))) {
    throw new Error("Plano Plus necessário para gerenciar promoções");
  }

  return provider;
}

function validatePromotionInput(input: {
  readonly title: string;
  readonly description: string;
  readonly priceOriginal: number;
  readonly pricePromo: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
}) {
  if (!input.title.trim() || input.title.trim().length < 2) {
    throw new Error("Informe um título válido");
  }
  if (!input.description.trim() || input.description.trim().length < 4) {
    throw new Error("Informe uma descrição válida");
  }
  if (input.priceOriginal <= 0 || input.pricePromo <= 0) {
    throw new Error("Informe preços válidos");
  }
  if (input.pricePromo >= input.priceOriginal) {
    throw new Error("O preço promocional deve ser menor que o original");
  }
  if (input.endsAt.getTime() <= input.startsAt.getTime()) {
    throw new Error("A data final deve ser posterior ao início");
  }
}

export async function upsertProviderPromotion(input: {
  readonly providerId: string;
  readonly promotionId?: string;
  readonly title: string;
  readonly description: string;
  readonly priceOriginal: number;
  readonly pricePromo: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly imageUrl?: string | null;
}) {
  await requirePlusProvider(input.providerId);
  validatePromotionInput(input);

  const data = {
    title: input.title.trim(),
    description: input.description.trim(),
    priceOriginal: input.priceOriginal,
    pricePromo: input.pricePromo,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    imageUrl: input.imageUrl ?? undefined,
  };

  if (input.promotionId) {
    const existing = await prisma.providerPromotion.findFirst({
      where: { id: input.promotionId, providerId: input.providerId },
    });
    if (!existing) {
      throw new Error("Promoção não encontrada");
    }

    const now = new Date();
    const isEnabled =
      data.endsAt.getTime() >= now.getTime() ? existing.isEnabled : false;

    return prisma.providerPromotion.update({
      where: { id: input.promotionId },
      data: {
        ...data,
        imageUrl: input.imageUrl ?? existing.imageUrl,
        isEnabled,
      },
    });
  }

  const count = await prisma.providerPromotion.count({
    where: { providerId: input.providerId },
  });
  if (count >= PRICING.PLUS_MAX_PROMOTIONS) {
    throw new Error(
      `Limite de ${PRICING.PLUS_MAX_PROMOTIONS} promoções por empresa atingido`
    );
  }

  return prisma.providerPromotion.create({
    data: {
      providerId: input.providerId,
      ...data,
      imageUrl: input.imageUrl ?? null,
      sortOrder: count,
    },
  });
}

export async function deleteProviderPromotion(input: {
  readonly providerId: string;
  readonly promotionId: string;
}) {
  await requirePlusProvider(input.providerId);

  const existing = await prisma.providerPromotion.findFirst({
    where: { id: input.promotionId, providerId: input.providerId },
  });
  if (!existing) {
    throw new Error("Promoção não encontrada");
  }

  await prisma.providerPromotion.delete({ where: { id: input.promotionId } });
}

export async function setProviderPromotionEnabled(input: {
  readonly providerId: string;
  readonly promotionId: string;
  readonly enabled: boolean;
}) {
  await requirePlusProvider(input.providerId);

  const existing = await prisma.providerPromotion.findFirst({
    where: { id: input.promotionId, providerId: input.providerId },
  });
  if (!existing) {
    throw new Error("Promoção não encontrada");
  }

  const now = new Date();
  if (input.enabled && existing.endsAt.getTime() < now.getTime()) {
    throw new Error(
      "Promoção expirada. Edite as datas antes de reativar."
    );
  }

  return prisma.providerPromotion.update({
    where: { id: input.promotionId },
    data: { isEnabled: input.enabled },
  });
}
