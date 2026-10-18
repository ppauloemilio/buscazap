import { randomBytes, randomInt } from "crypto";
import bcrypt from "bcryptjs";
import {
  buildClaimInboundWhatsAppHref,
  formatBuscazappClaimWhatsAppDisplay,
  isBuscazappClaimWhatsAppConfigured,
} from "@/config/claim-whatsapp";
import {
  CLAIM_REQUEST_STATUS,
  type ClaimRequestStatus,
} from "@/config/claim-requests";
import { logAdminAction } from "@/application/services/admin-service";
import { resolveCategorySlugByName } from "@/application/services/slug-service";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppIdentity } from "@/lib/whatsapp";
import { ProviderStatus, UserRole } from "@/domain/enums";
import { buildAbsoluteUrl } from "@/lib/site-url";
import { generateTemporaryPassword } from "@/lib/temporary-password";
import { buildAdvertisementNotifyWhatsAppHref } from "@/lib/advertisement-notify-message";

const CLAIM_TOKEN_DAYS = 30;

export function buildClaimUrl(token: string): string {
  return buildAbsoluteUrl(`/reivindicar?token=${encodeURIComponent(token)}`);
}

export function formatClaimCodeMessage(code: string): string {
  return `BZ-${code}`;
}

export async function issueProviderClaimToken(providerId: string): Promise<{
  readonly token: string;
  readonly claimUrl: string;
}> {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CLAIM_TOKEN_DAYS);

  await prisma.provider.update({
    where: { id: providerId },
    data: {
      claimToken: token,
      claimTokenExpiresAt: expiresAt,
    },
  });

  return { token, claimUrl: buildClaimUrl(token) };
}

export async function getProviderByClaimToken(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const provider = await prisma.provider.findFirst({
    where: {
      claimToken: trimmed,
      role: UserRole.PROVIDER,
      status: { not: ProviderStatus.BLOCKED },
    },
    select: {
      id: true,
      name: true,
      whatsapp: true,
      claimTokenExpiresAt: true,
      claimVerifiedAt: true,
      advertisements: {
        where: { status: { not: "INACTIVE" } },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          city: true,
          neighborhood: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!provider) return null;
  if (
    provider.claimTokenExpiresAt &&
    provider.claimTokenExpiresAt.getTime() < Date.now()
  ) {
    return null;
  }

  return provider;
}

export async function findClaimableProviderByWhatsapp(whatsappRaw: string) {
  const whatsapp =
    normalizeWhatsAppIdentity(whatsappRaw) ?? whatsappRaw.replace(/\D/g, "");
  if (!whatsapp || whatsapp.length < 10) {
    throw new Error("Informe um WhatsApp válido");
  }

  const provider = await prisma.provider.findFirst({
    where: {
      whatsapp,
      role: UserRole.PROVIDER,
      status: { not: ProviderStatus.BLOCKED },
    },
    select: {
      id: true,
      name: true,
      whatsapp: true,
      claimVerifiedAt: true,
      advertisements: {
        where: { status: { not: "INACTIVE" } },
        select: {
          id: true,
          title: true,
          city: true,
          neighborhood: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!provider || provider.advertisements.length === 0) {
    throw new Error(
      "Não encontramos anúncio público com este WhatsApp. Confira o número ou fale com o suporte."
    );
  }

  if (provider.claimVerifiedAt) {
    throw new Error(
      "Este perfil já foi reivindicado. Entre no painel com seu WhatsApp e senha, ou use Esqueci minha senha."
    );
  }

  return provider;
}

/** Cria (ou atualiza) pedido PENDING e devolve o código para o dono enviar ao BuscaZapp. */
export async function createClaimRequest(whatsappRaw: string): Promise<{
  readonly requestId: string;
  readonly providerId: string;
  readonly code: string;
  readonly codeMessage: string;
  readonly supportWhatsappDisplay: string;
  readonly supportWhatsappHref: string | null;
  readonly adsCount: number;
  readonly providerName: string;
}> {
  const provider = await findClaimableProviderByWhatsapp(whatsappRaw);

  const existingPending = await prisma.providerClaimRequest.findFirst({
    where: {
      providerId: provider.id,
      status: CLAIM_REQUEST_STATUS.PENDING,
    },
    orderBy: { createdAt: "desc" },
  });

  const code = existingPending?.code ?? String(randomInt(100000, 999999));
  const codeMessage = formatClaimCodeMessage(code);

  let requestId: string;
  if (existingPending) {
    requestId = existingPending.id;
  } else {
    const created = await prisma.providerClaimRequest.create({
      data: {
        providerId: provider.id,
        whatsapp: provider.whatsapp,
        code,
        status: CLAIM_REQUEST_STATUS.PENDING,
      },
    });
    requestId = created.id;
  }

  await issueProviderClaimToken(provider.id);

  return {
    requestId,
    providerId: provider.id,
    code,
    codeMessage,
    supportWhatsappDisplay: isBuscazappClaimWhatsAppConfigured()
      ? formatBuscazappClaimWhatsAppDisplay()
      : "",
    supportWhatsappHref: isBuscazappClaimWhatsAppConfigured()
      ? buildClaimInboundWhatsAppHref(code)
      : null,
    adsCount: provider.advertisements.length,
    providerName: provider.name,
  };
}

export async function createClaimRequestFromToken(token: string) {
  const provider = await getProviderByClaimToken(token);
  if (!provider) {
    throw new Error("Link inválido ou expirado");
  }
  if (provider.claimVerifiedAt) {
    throw new Error(
      "Este perfil já foi reivindicado. Entre no painel com seu WhatsApp e senha."
    );
  }
  return createClaimRequest(provider.whatsapp);
}

export async function listClaimRequests(statusFilter?: string) {
  const status =
    statusFilter &&
    Object.values(CLAIM_REQUEST_STATUS).includes(
      statusFilter as ClaimRequestStatus
    )
      ? statusFilter
      : CLAIM_REQUEST_STATUS.PENDING;

  return prisma.providerClaimRequest.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          whatsapp: true,
          claimVerifiedAt: true,
          advertisements: {
            where: { status: { not: "INACTIVE" } },
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              city: true,
              neighborhood: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });
}

export async function countPendingClaimRequests(): Promise<number> {
  return prisma.providerClaimRequest.count({
    where: { status: CLAIM_REQUEST_STATUS.PENDING },
  });
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

/**
 * Admin confere a mensagem no WhatsApp do BuscaZapp e aprova:
 * gera senha temporária + marca claimVerifiedAt + devolve link wa.me.
 */
export async function approveClaimRequestAndNotify(input: {
  readonly adminId: string;
  readonly requestId: string;
}): Promise<{ readonly notifyHref: string; readonly temporaryPassword: string }> {
  const request = await prisma.providerClaimRequest.findUnique({
    where: { id: input.requestId },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          whatsapp: true,
          role: true,
          status: true,
          advertisements: {
            where: { status: { not: "INACTIVE" } },
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!request) {
    throw new Error("Pedido de reivindicação não encontrado");
  }
  if (request.status !== CLAIM_REQUEST_STATUS.PENDING) {
    throw new Error("Este pedido já foi analisado");
  }
  if (
    request.provider.role !== UserRole.PROVIDER ||
    request.provider.status === ProviderStatus.BLOCKED
  ) {
    throw new Error("Conta inválida para reivindicação");
  }

  const ad = request.provider.advertisements[0];
  if (!ad) {
    throw new Error("Provedor sem anúncio ativo");
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const adUrl = await buildPublicAdUrl({
    advertisementId: ad.id,
    slug: ad.slug,
    category: ad.category,
  });

  await prisma.$transaction([
    prisma.provider.update({
      where: { id: request.provider.id },
      data: {
        passwordHash,
        claimVerifiedAt: new Date(),
        claimToken: null,
        claimTokenExpiresAt: null,
      },
    }),
    prisma.providerClaimRequest.update({
      where: { id: request.id },
      data: {
        status: CLAIM_REQUEST_STATUS.APPROVED,
        reviewedById: input.adminId,
        reviewedAt: new Date(),
      },
    }),
    prisma.providerClaimRequest.updateMany({
      where: {
        providerId: request.provider.id,
        status: CLAIM_REQUEST_STATUS.PENDING,
        id: { not: request.id },
      },
      data: {
        status: CLAIM_REQUEST_STATUS.REJECTED,
        reviewedById: input.adminId,
        reviewedAt: new Date(),
      },
    }),
  ]);

  await logAdminAction({
    adminId: input.adminId,
    action: "APPROVE_CLAIM_REQUEST",
    entityType: "ProviderClaimRequest",
    entityId: request.id,
    metadata: {
      providerId: request.provider.id,
      whatsapp: request.whatsapp,
      code: request.code,
      advertisementId: ad.id,
    },
  });

  const notifyHref = buildAdvertisementNotifyWhatsAppHref({
    providerName: request.provider.name,
    adTitle: ad.title,
    whatsapp: request.provider.whatsapp,
    adUrl,
    temporaryPassword,
  });

  return { notifyHref, temporaryPassword };
}

export async function rejectClaimRequest(input: {
  readonly adminId: string;
  readonly requestId: string;
}): Promise<void> {
  const request = await prisma.providerClaimRequest.findUnique({
    where: { id: input.requestId },
    select: { id: true, status: true, providerId: true },
  });

  if (!request) {
    throw new Error("Pedido de reivindicação não encontrado");
  }
  if (request.status !== CLAIM_REQUEST_STATUS.PENDING) {
    throw new Error("Este pedido já foi analisado");
  }

  await prisma.providerClaimRequest.update({
    where: { id: request.id },
    data: {
      status: CLAIM_REQUEST_STATUS.REJECTED,
      reviewedById: input.adminId,
      reviewedAt: new Date(),
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "REJECT_CLAIM_REQUEST",
    entityType: "ProviderClaimRequest",
    entityId: request.id,
    metadata: { providerId: request.providerId },
  });
}
