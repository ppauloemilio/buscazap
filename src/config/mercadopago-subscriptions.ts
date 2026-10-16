import { getPixAppUrl } from "@/config/pix";
import { PRICING } from "@/config/pricing";
import { SubscriptionTier } from "@/domain/enums";

function normalizeEnv(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

/** Token da app Assinaturas — NUNCA o MERCADOPAGO_ACCESS_TOKEN do PIX. */
export function getMercadoPagoSubscriptionsAccessToken(): string {
  return normalizeEnv(process.env.MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN);
}

export function getMercadoPagoSubscriptionsWebhookSecret(): string {
  return normalizeEnv(process.env.MERCADOPAGO_SUBSCRIPTIONS_WEBHOOK_SECRET);
}

/** Opcional — planos no MP não são usados no checkout (fluxo sem plano + init_point). */
export function getMercadoPagoPlanBasicId(): string {
  return normalizeEnv(process.env.MERCADOPAGO_PLAN_BASIC_ID);
}

/** Opcional — ver getMercadoPagoPlanBasicId. */
export function getMercadoPagoPlanPlusId(): string {
  return normalizeEnv(process.env.MERCADOPAGO_PLAN_PLUS_ID);
}

/** Só o token da app Assinaturas; valores vêm de PRICING. */
export function isMercadoPagoSubscriptionsEnabled(): boolean {
  return getMercadoPagoSubscriptionsAccessToken().length > 0;
}

export function getSubscriptionBackUrl(): string {
  return `${getPixAppUrl()}/painel/assinatura`;
}

export function getRecurringAmountForTier(tier: SubscriptionTier): number {
  return tier === SubscriptionTier.PLUS
    ? PRICING.SUBSCRIPTION_PLUS_AMOUNT
    : PRICING.SUBSCRIPTION_AMOUNT;
}

export function buildRecurringExternalReference(
  providerId: string,
  tier: SubscriptionTier
): string {
  return `bz-recurring:${providerId}:${tier}`;
}

export function parseRecurringExternalReference(value: string | null | undefined): {
  readonly providerId: string;
  readonly tier: SubscriptionTier;
} | null {
  if (!value) return null;
  const match = /^bz-recurring:([^:]+):(BASIC|PLUS)$/.exec(value.trim());
  if (!match) return null;
  return {
    providerId: match[1],
    tier: match[2] === "PLUS" ? SubscriptionTier.PLUS : SubscriptionTier.BASIC,
  };
}
