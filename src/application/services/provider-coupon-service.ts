import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import QRCode from "qrcode";
import { PRICING } from "@/config/pricing";
import { canUsePlusFeatures } from "@/lib/plus-plan";
import { prisma } from "@/lib/prisma";
import { buildAbsoluteUrl } from "@/lib/site-url";
import { buildWhatsAppLink } from "@/shared/utils/format";

export type ProviderCouponRecord = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly quantityTotal: number;
  readonly quantityRemaining: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly isEnabled: boolean;
  readonly sortOrder: number;
};

export type CouponRedemptionRecord = {
  readonly id: string;
  readonly code: string;
  readonly status: string;
  readonly issuedAt: Date;
  readonly usedAt: Date | null;
  readonly couponTitle: string;
};

function mapCoupon(row: {
  id: string;
  title: string;
  description: string;
  badgeLabel: string;
  quantityTotal: number;
  quantityRemaining: number;
  startsAt: Date;
  endsAt: Date;
  isEnabled: boolean;
  sortOrder: number;
}): ProviderCouponRecord {
  return row;
}

export async function expireProviderCoupons(providerId?: string) {
  const now = new Date();
  await prisma.providerCoupon.updateMany({
    where: {
      ...(providerId ? { providerId } : {}),
      isEnabled: true,
      endsAt: { lt: now },
    },
    data: { isEnabled: false },
  });
}

export async function listProviderCouponsForPanel(providerId: string) {
  await expireProviderCoupons(providerId);

  const rows = await prisma.providerCoupon.findMany({
    where: { providerId },
    orderBy: { sortOrder: "asc" },
  });

  return rows.map(mapCoupon);
}

export async function listCouponRedemptionsForPanel(providerId: string) {
  const rows = await prisma.couponRedemption.findMany({
    where: { coupon: { providerId } },
    include: { coupon: { select: { title: true } } },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return rows.map(
    (row): CouponRedemptionRecord => ({
      id: row.id,
      code: row.code,
      status: row.status,
      issuedAt: row.issuedAt,
      usedAt: row.usedAt,
      couponTitle: row.coupon.title,
    })
  );
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
    throw new Error("Plano Pro necessário para gerenciar cupons");
  }

  return provider;
}

function validateCouponInput(input: {
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly quantityTotal: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
}) {
  if (!input.title.trim() || !input.description.trim() || !input.badgeLabel.trim()) {
    throw new Error("Preencha título, descrição e selo do cupom");
  }
  if (input.quantityTotal < 1 || input.quantityTotal > 9999) {
    throw new Error("Quantidade deve ser entre 1 e 9999");
  }
  if (input.endsAt.getTime() <= input.startsAt.getTime()) {
    throw new Error("Data final deve ser após a data inicial");
  }
}

export async function upsertProviderCoupon(input: {
  readonly providerId: string;
  readonly couponId?: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly quantityTotal: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
}) {
  await requirePlusProvider(input.providerId);
  validateCouponInput(input);

  const data = {
    title: input.title.trim(),
    description: input.description.trim(),
    badgeLabel: input.badgeLabel.trim(),
    quantityTotal: input.quantityTotal,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  };

  if (input.couponId) {
    const existing = await prisma.providerCoupon.findFirst({
      where: { id: input.couponId, providerId: input.providerId },
    });
    if (!existing) {
      throw new Error("Cupom não encontrado");
    }

    const used = existing.quantityTotal - existing.quantityRemaining;
    const nextRemaining = Math.max(0, input.quantityTotal - used);
    const now = new Date();
    const isEnabled =
      data.endsAt.getTime() >= now.getTime() ? existing.isEnabled : false;

    return prisma.providerCoupon.update({
      where: { id: existing.id },
      data: {
        ...data,
        quantityRemaining: nextRemaining,
        isEnabled,
      },
    });
  }

  const count = await prisma.providerCoupon.count({
    where: { providerId: input.providerId },
  });
  if (count >= PRICING.PLUS_MAX_COUPONS) {
    throw new Error(
      `Limite de ${PRICING.PLUS_MAX_COUPONS} cupons por empresa atingido`
    );
  }

  return prisma.providerCoupon.create({
    data: {
      providerId: input.providerId,
      ...data,
      quantityRemaining: input.quantityTotal,
      sortOrder: count,
    },
  });
}

export async function deleteProviderCoupon(input: {
  readonly providerId: string;
  readonly couponId: string;
}) {
  await requirePlusProvider(input.providerId);
  await prisma.providerCoupon.deleteMany({
    where: { id: input.couponId, providerId: input.providerId },
  });
}

export async function setProviderCouponEnabled(input: {
  readonly providerId: string;
  readonly couponId: string;
  readonly enabled: boolean;
}) {
  await requirePlusProvider(input.providerId);
  const existing = await prisma.providerCoupon.findFirst({
    where: { id: input.couponId, providerId: input.providerId },
  });
  if (!existing) {
    throw new Error("Cupom não encontrado");
  }

  const now = new Date();
  if (input.enabled && existing.endsAt.getTime() < now.getTime()) {
    throw new Error("Não é possível reativar um cupom expirado. Edite as datas.");
  }

  return prisma.providerCoupon.update({
    where: { id: existing.id },
    data: { isEnabled: input.enabled },
  });
}

function generateCouponCode(): string {
  return `BZ-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export type ClaimedCouponResult = {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly businessName: string;
  readonly issuedAt: string;
  readonly endsAt: string;
  readonly quantityRemaining: number;
  readonly qrDataUrl: string;
  readonly validateUrl: string;
  readonly whatsappLink: string | null;
};

export async function claimProviderCoupon(
  couponId: string
): Promise<ClaimedCouponResult> {
  await expireProviderCoupons();

  const now = new Date();
  let code = generateCouponCode();

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.providerCoupon.updateMany({
          where: {
            id: couponId,
            isEnabled: true,
            startsAt: { lte: now },
            endsAt: { gte: now },
            quantityRemaining: { gt: 0 },
          },
          data: { quantityRemaining: { decrement: 1 } },
        });

        if (updated.count === 0) {
          throw new Error("Cupom esgotado ou indisponível");
        }

        const coupon = await tx.providerCoupon.findUniqueOrThrow({
          where: { id: couponId },
          include: {
            provider: {
              select: {
                name: true,
                whatsapp: true,
                advertisements: {
                  where: { status: "APPROVED" },
                  orderBy: { updatedAt: "desc" },
                  take: 1,
                  select: { title: true, whatsappNumber: true },
                },
              },
            },
          },
        });

        const redemption = await tx.couponRedemption.create({
          data: {
            couponId,
            code,
            status: "ISSUED",
            issuedAt: now,
          },
        });

        return { coupon, redemption };
      });

      const ad = result.coupon.provider.advertisements[0];
      const businessName = ad?.title ?? result.coupon.provider.name;
      const whatsappNumber =
        ad?.whatsappNumber ?? result.coupon.provider.whatsapp;
      const validateUrl = buildAbsoluteUrl(`/cupom/${result.redemption.code}`);
      const qrDataUrl = await QRCode.toDataURL(validateUrl, {
        margin: 1,
        width: 280,
      });
      const message =
        `Olá! Resgatei o cupom ${result.redemption.code} no BuscaZapp ` +
        `(${result.coupon.title}). Gerado em ${now.toLocaleString("pt-BR")}.`;

      return {
        code: result.redemption.code,
        title: result.coupon.title,
        description: result.coupon.description,
        badgeLabel: result.coupon.badgeLabel,
        businessName,
        issuedAt: result.redemption.issuedAt.toISOString(),
        endsAt: result.coupon.endsAt.toISOString(),
        quantityRemaining: result.coupon.quantityRemaining,
        qrDataUrl,
        validateUrl,
        whatsappLink: whatsappNumber
          ? buildWhatsAppLink(whatsappNumber, message)
          : null,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        code = generateCouponCode();
        continue;
      }
      throw error;
    }
  }

  throw new Error("Não foi possível gerar o cupom. Tente novamente.");
}

export async function getCouponRedemptionByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  return prisma.couponRedemption.findUnique({
    where: { code: normalized },
    include: {
      coupon: {
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              whatsapp: true,
              advertisements: {
                where: { status: "APPROVED" },
                orderBy: { updatedAt: "desc" },
                take: 1,
                select: { title: true, whatsappNumber: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function markCouponRedemptionUsed(input: {
  readonly providerId: string;
  readonly code: string;
}) {
  await requirePlusProvider(input.providerId);

  const redemption = await prisma.couponRedemption.findFirst({
    where: {
      code: input.code.trim().toUpperCase(),
      coupon: { providerId: input.providerId },
    },
  });

  if (!redemption) {
    throw new Error("Cupom não encontrado");
  }
  if (redemption.status === "USED") {
    throw new Error("Este cupom já foi marcado como usado");
  }

  return prisma.couponRedemption.update({
    where: { id: redemption.id },
    data: { status: "USED", usedAt: new Date() },
  });
}
