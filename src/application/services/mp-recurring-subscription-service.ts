import {
  buildRecurringExternalReference,
  getRecurringAmountForTier,
  getSubscriptionBackUrl,
  isMercadoPagoSubscriptionsEnabled,
  parseRecurringExternalReference,
} from "@/config/mercadopago-subscriptions";
import { PRICING } from "@/config/pricing";
import {
  ListingProfile,
  PaymentStatus,
  PaymentType,
  SUBSCRIPTION_TIER_REFERENCE,
  SubscriptionTier,
} from "@/domain/enums";
import {
  cancelMercadoPagoPreapproval,
  createMercadoPagoPreapproval,
  fetchMercadoPagoAuthorizedPayment,
  fetchMercadoPagoPreapproval,
  fetchMercadoPagoSubscriptionPayment,
  resolvePreapprovalCheckoutUrl,
  searchMercadoPagoAuthorizedPayments,
} from "@/infrastructure/mercadopago/subscriptions-client";
import { getProviderSubscriptionTier } from "@/lib/plus-plan";
import { prisma } from "@/lib/prisma";
import {
  hasActiveSubscription,
  isAdminProvider,
} from "@/lib/provider-session";

function normalizeRecurringStatus(status: string | undefined): string {
  return (status ?? "pending").toLowerCase();
}

function isAuthorizedStatus(status: string): boolean {
  return status === "authorized" || status === "active";
}

export function getProviderRecurringSubscription(provider: {
  readonly mpRecurringId: string | null;
  readonly mpRecurringStatus: string | null;
  readonly mpRecurringTier: string | null;
  readonly mpRecurringUpdatedAt: Date | null;
}) {
  if (!provider.mpRecurringId) {
    return null;
  }

  const status = normalizeRecurringStatus(provider.mpRecurringStatus ?? undefined);
  return {
    id: provider.mpRecurringId,
    status,
    tier:
      provider.mpRecurringTier === SubscriptionTier.PLUS
        ? SubscriptionTier.PLUS
        : SubscriptionTier.BASIC,
    updatedAt: provider.mpRecurringUpdatedAt,
    isActive: isAuthorizedStatus(status),
    isPending: status === "pending",
    enabled: isMercadoPagoSubscriptionsEnabled(),
  };
}

export async function startRecurringSubscriptionCheckout(input: {
  readonly providerId: string;
  readonly tier: SubscriptionTier;
}): Promise<{ readonly checkoutUrl: string }> {
  if (!isMercadoPagoSubscriptionsEnabled()) {
    throw new Error("Renovação automática ainda não está disponível");
  }

  const provider = await prisma.provider.findUnique({
    where: { id: input.providerId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      subscriptionExpiresAt: true,
      subscriptionTier: true,
      mpRecurringId: true,
      mpRecurringStatus: true,
    },
  });

  if (!provider || isAdminProvider(provider)) {
    throw new Error("Conta inválida para assinatura recorrente");
  }

  if (provider.status === "BLOCKED") {
    throw new Error("Conta bloqueada");
  }

  const email = provider.email?.trim();
  if (!email || !email.includes("@")) {
    throw new Error(
      "Cadastre um e-mail em Meu perfil para ativar a renovação automática"
    );
  }

  const currentStatus = normalizeRecurringStatus(
    provider.mpRecurringStatus ?? undefined
  );
  if (
    provider.mpRecurringId &&
    isAuthorizedStatus(currentStatus)
  ) {
    throw new Error(
      "Você já tem renovação automática ativa. Cancele antes de mudar de plano."
    );
  }

  const hasActive = hasActiveSubscription(provider.subscriptionExpiresAt);
  const currentTier = getProviderSubscriptionTier(provider);
  const isCardUpgradeToPlus =
    hasActive &&
    currentTier === SubscriptionTier.BASIC &&
    input.tier === SubscriptionTier.PLUS;

  // Downgrade via cartão não é suportado (manter Pro até o fim ou voltar ao básico no painel).
  if (
    hasActive &&
    currentTier === SubscriptionTier.PLUS &&
    input.tier === SubscriptionTier.BASIC
  ) {
    throw new Error(
      "Para renovar no Plano Básico, volte ao básico no painel ou aguarde o vencimento."
    );
  }

  const reason =
    input.tier === SubscriptionTier.PLUS
      ? "BuscaZapp Plano Pro"
      : "BuscaZapp Plano Básico";

  // Mesmo plano já pago: só vincula cartão e cobra na data de vencimento.
  // Upgrade Básico → Pro no cartão: cobra o Pro agora (mensalidade cheia) e fica recorrente.
  const startDate =
    hasActive && !isCardUpgradeToPlus && provider.subscriptionExpiresAt
      ? provider.subscriptionExpiresAt.toISOString()
      : undefined;

  const preapproval = await createMercadoPagoPreapproval({
    reason,
    payerEmail: email,
    externalReference: buildRecurringExternalReference(
      provider.id,
      input.tier
    ),
    backUrl: getSubscriptionBackUrl(),
    amount: getRecurringAmountForTier(input.tier),
    startDate,
  });

  const checkoutUrl = resolvePreapprovalCheckoutUrl(preapproval);
  if (!checkoutUrl || !preapproval.id) {
    throw new Error("Mercado Pago não retornou link de checkout da assinatura");
  }

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      mpRecurringId: preapproval.id,
      mpRecurringStatus: normalizeRecurringStatus(preapproval.status),
      mpRecurringTier: input.tier,
      mpRecurringUpdatedAt: new Date(),
    },
  });

  return { checkoutUrl };
}

export async function cancelProviderRecurringSubscription(
  providerId: string
): Promise<void> {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      role: true,
      subscriptionExpiresAt: true,
      mpRecurringId: true,
      mpRecurringStatus: true,
    },
  });

  if (!provider || isAdminProvider(provider)) {
    throw new Error("Conta inválida");
  }

  if (!provider.mpRecurringId) {
    throw new Error("Nenhuma renovação automática encontrada");
  }

  const remote = await cancelMercadoPagoPreapproval(provider.mpRecurringId);

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      mpRecurringStatus: normalizeRecurringStatus(remote.status ?? "cancelled"),
      mpRecurringUpdatedAt: new Date(),
    },
  });
}

async function syncProviderFromPreapproval(preapprovalId: string) {
  const preapproval = await fetchMercadoPagoPreapproval(preapprovalId);
  const parsed = parseRecurringExternalReference(preapproval.external_reference);

  let provider =
    parsed != null
      ? await prisma.provider.findUnique({ where: { id: parsed.providerId } })
      : null;

  if (!provider) {
    provider = await prisma.provider.findFirst({
      where: { mpRecurringId: preapprovalId },
    });
  }

  if (!provider) {
    return { ignored: true as const, reason: "provider_not_found" };
  }

  const tier =
    parsed?.tier ??
    (provider.mpRecurringTier === SubscriptionTier.PLUS
      ? SubscriptionTier.PLUS
      : SubscriptionTier.BASIC);

  const status = normalizeRecurringStatus(preapproval.status);

  // Só sincroniza vínculo/status. Extensão de vencimento e Payment
  // acontecem nos webhooks de cobrança (authorized_payment / payment).
  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      mpRecurringId: preapproval.id ?? preapprovalId,
      mpRecurringStatus: status,
      mpRecurringTier: tier,
      mpRecurringUpdatedAt: new Date(),
    },
  });

  return { ignored: false as const, providerId: provider.id, status };
}

/**
 * Atualiza o status local consultando o MP (não depende só do webhook).
 * Útil ao abrir /painel/assinatura após o checkout.
 */
export async function refreshProviderRecurringFromMercadoPago(
  providerId: string
): Promise<{
  readonly mpRecurringId: string | null;
  readonly mpRecurringStatus: string | null;
  readonly mpRecurringTier: string | null;
  readonly mpRecurringUpdatedAt: Date | null;
} | null> {
  if (!isMercadoPagoSubscriptionsEnabled()) {
    return null;
  }

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      mpRecurringId: true,
      mpRecurringStatus: true,
      mpRecurringTier: true,
      mpRecurringUpdatedAt: true,
    },
  });

  if (!provider?.mpRecurringId) {
    return provider;
  }

  try {
    await syncProviderFromPreapproval(provider.mpRecurringId);
  } catch {
    // Mantém o status local se a API do MP falhar.
    return provider;
  }

  return prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      mpRecurringId: true,
      mpRecurringStatus: true,
      mpRecurringTier: true,
      mpRecurringUpdatedAt: true,
    },
  });
}

/**
 * Sincroniza status + aplica cobranças aprovadas no MP que ainda não geraram ciclo local.
 * Usado pelo admin quando o webhook não entregou.
 */
export async function syncProviderRecurringCharges(providerId: string): Promise<{
  readonly status: string | null;
  readonly appliedCharges: number;
}> {
  if (!isMercadoPagoSubscriptionsEnabled()) {
    throw new Error("Assinaturas Mercado Pago não configuradas");
  }

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      mpRecurringId: true,
      mpRecurringTier: true,
    },
  });

  if (!provider?.mpRecurringId) {
    throw new Error("Provedor sem renovação automática vinculada");
  }

  await syncProviderFromPreapproval(provider.mpRecurringId);

  const refreshed = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      mpRecurringId: true,
      mpRecurringStatus: true,
      mpRecurringTier: true,
    },
  });

  const preapprovalId = refreshed?.mpRecurringId ?? provider.mpRecurringId;
  const invoices = await searchMercadoPagoAuthorizedPayments(preapprovalId);
  let appliedCharges = 0;

  const tier =
    refreshed?.mpRecurringTier === SubscriptionTier.PLUS
      ? SubscriptionTier.PLUS
      : SubscriptionTier.BASIC;

  for (const invoice of invoices) {
    const paymentStatus = (invoice.payment?.status ?? "").toLowerCase();
    const invoiceStatus = (invoice.status ?? "").toLowerCase();
    const approved =
      paymentStatus === "approved" ||
      paymentStatus === "authorized" ||
      invoiceStatus === "processed" ||
      invoiceStatus === "approved";

    if (!approved || invoice.id == null) {
      continue;
    }

    const amountRaw = invoice.transaction_amount;
    const amount =
      typeof amountRaw === "number"
        ? amountRaw
        : typeof amountRaw === "string"
          ? Number(amountRaw)
          : getRecurringAmountForTier(tier);

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    const paidAt = invoice.debit_date
      ? new Date(invoice.debit_date)
      : new Date();

    const before = await prisma.payment.findUnique({
      where: { pixTxId: `mp-authorized:${invoice.id}` },
      select: { status: true },
    });

    await grantRecurringCycle({
      providerId,
      tier,
      amount,
      externalKey: `mp-authorized:${invoice.id}`,
      paidAt: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
    });

    if (before?.status !== PaymentStatus.PAID) {
      appliedCharges += 1;
    }
  }

  return {
    status: refreshed?.mpRecurringStatus ?? null,
    appliedCharges,
  };
}

async function grantRecurringCycle(input: {
  readonly providerId: string;
  readonly tier: SubscriptionTier;
  readonly amount: number;
  readonly externalKey: string;
  readonly paidAt: Date;
}) {
  const existing = await prisma.payment.findUnique({
    where: { pixTxId: input.externalKey },
    select: { id: true, status: true },
  });

  if (existing?.status === PaymentStatus.PAID) {
    return existing.id;
  }

  const referenceId =
    input.tier === SubscriptionTier.PLUS
      ? SUBSCRIPTION_TIER_REFERENCE.PLUS
      : SUBSCRIPTION_TIER_REFERENCE.BASIC;

  return prisma.$transaction(async (tx) => {
    const payment =
      existing != null
        ? await tx.payment.update({
            where: { id: existing.id },
            data: {
              status: PaymentStatus.PAID,
              paidAt: input.paidAt,
              amount: input.amount,
              referenceId,
            },
          })
        : await tx.payment.create({
            data: {
              providerId: input.providerId,
              type: PaymentType.SUBSCRIPTION,
              amount: input.amount,
              status: PaymentStatus.PAID,
              pixTxId: input.externalKey,
              pixCopyPaste: `mp-recurring:${input.externalKey}`,
              referenceId,
              paidAt: input.paidAt,
              expiresAt: new Date(
                input.paidAt.getTime() + 24 * 60 * 60 * 1000
              ),
            },
          });

    const alreadyLinked = await tx.subscription.findUnique({
      where: { paymentId: payment.id },
      select: { id: true },
    });
    if (alreadyLinked) {
      return payment.id;
    }

    const provider = await tx.provider.findUnique({
      where: { id: input.providerId },
    });
    if (!provider) {
      throw new Error("PROVIDER_NOT_FOUND");
    }

    const previousTier = getProviderSubscriptionTier(provider);
    const isCardUpgradeToPlus =
      input.tier === SubscriptionTier.PLUS &&
      previousTier === SubscriptionTier.BASIC &&
      hasActiveSubscription(provider.subscriptionExpiresAt);

    // Upgrade no cartão: novo ciclo a partir da cobrança (alinha com a recorrência do MP).
    // Demais casos: empilha a partir do vencimento atual se ainda vigente.
    const baseDate =
      isCardUpgradeToPlus
        ? input.paidAt
        : provider.subscriptionExpiresAt &&
            provider.subscriptionExpiresAt.getTime() > input.paidAt.getTime()
          ? provider.subscriptionExpiresAt
          : input.paidAt;

    const expiresAt = new Date(baseDate);
    expiresAt.setDate(expiresAt.getDate() + PRICING.SUBSCRIPTION_DAYS);

    await tx.subscription.create({
      data: {
        providerId: input.providerId,
        paymentId: payment.id,
        amount: input.amount,
        startsAt: input.paidAt,
        expiresAt,
      },
    });

    await tx.provider.update({
      where: { id: input.providerId },
      data: {
        subscriptionExpiresAt: expiresAt,
        subscriptionTier: input.tier,
        listingProfile: ListingProfile.FULL,
      },
    });

    await tx.advertisement.updateMany({
      where: {
        providerId: input.providerId,
        status: "INACTIVE",
      },
      data: { status: "APPROVED" },
    });

    return payment.id;
  });
}

export async function handleMercadoPagoSubscriptionPreapprovalWebhook(
  preapprovalId: string
) {
  return syncProviderFromPreapproval(preapprovalId);
}

export async function handleMercadoPagoSubscriptionAuthorizedPaymentWebhook(
  authorizedPaymentId: string
) {
  const authorized = await fetchMercadoPagoAuthorizedPayment(authorizedPaymentId);
  const preapprovalId = authorized.preapproval_id;
  if (!preapprovalId) {
    return { ignored: true as const, reason: "missing_preapproval" };
  }

  const preapproval = await fetchMercadoPagoPreapproval(preapprovalId);
  const parsed = parseRecurringExternalReference(
    authorized.external_reference ?? preapproval.external_reference
  );

  const provider =
    (parsed
      ? await prisma.provider.findUnique({ where: { id: parsed.providerId } })
      : null) ??
    (await prisma.provider.findFirst({
      where: { mpRecurringId: preapprovalId },
    }));

  if (!provider) {
    return { ignored: true as const, reason: "provider_not_found" };
  }

  const paymentStatus = (
    authorized.payment?.status ??
    authorized.status ??
    ""
  ).toLowerCase();

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      mpRecurringId: preapprovalId,
      mpRecurringStatus: normalizeRecurringStatus(preapproval.status),
      mpRecurringTier:
        parsed?.tier ??
        provider.mpRecurringTier ??
        SubscriptionTier.BASIC,
      mpRecurringUpdatedAt: new Date(),
    },
  });

  if (paymentStatus !== "approved" && paymentStatus !== "authorized") {
    return {
      ignored: true as const,
      reason: "payment_not_approved",
      status: paymentStatus,
    };
  }

  const tier =
    parsed?.tier ??
    (provider.mpRecurringTier === SubscriptionTier.PLUS
      ? SubscriptionTier.PLUS
      : SubscriptionTier.BASIC);

  const amount =
    authorized.payment?.transaction_amount ??
    authorized.transaction_amount ??
    getRecurringAmountForTier(tier);

  const paymentId = await grantRecurringCycle({
    providerId: provider.id,
    tier,
    amount,
    externalKey: `mp-authorized:${authorizedPaymentId}`,
    paidAt: new Date(),
  });

  return { ignored: false as const, providerId: provider.id, paymentId };
}

/** Pagamento avulso gerado pela assinatura (type=payment) — só se external_reference for nosso. */
export async function handleMercadoPagoSubscriptionPaymentWebhook(
  paymentId: string
) {
  const payment = await fetchMercadoPagoSubscriptionPayment(paymentId);
  const parsed = parseRecurringExternalReference(payment.external_reference);

  if (!parsed) {
    return { ignored: true as const, reason: "not_recurring_reference" };
  }

  if ((payment.status ?? "").toLowerCase() !== "approved") {
    return {
      ignored: true as const,
      reason: "payment_not_approved",
      status: payment.status,
    };
  }

  const localPaymentId = await grantRecurringCycle({
    providerId: parsed.providerId,
    tier: parsed.tier,
    amount: payment.transaction_amount ?? getRecurringAmountForTier(parsed.tier),
    externalKey: `mp-payment:${paymentId}`,
    paidAt: new Date(),
  });

  return {
    ignored: false as const,
    providerId: parsed.providerId,
    paymentId: localPaymentId,
  };
}
