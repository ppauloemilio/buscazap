import { PRICING } from "@/config/pricing";
import { prisma } from "@/lib/prisma";
import { markDataFetchDynamic } from "@/lib/db";

export type LivePricingAmounts = {
  readonly subscriptionAmount: number;
  readonly subscriptionPlusAmount: number;
  readonly extraWhatsappAmount: number;
  readonly extraAdAmount: number;
  readonly premiumBoostAmount: number;
};

export const DEFAULT_LIVE_PRICING: LivePricingAmounts = {
  subscriptionAmount: PRICING.SUBSCRIPTION_AMOUNT,
  subscriptionPlusAmount: PRICING.SUBSCRIPTION_PLUS_AMOUNT,
  extraWhatsappAmount: PRICING.EXTRA_WHATSAPP_AMOUNT,
  extraAdAmount: PRICING.EXTRA_AD_AMOUNT,
  premiumBoostAmount: PRICING.PREMIUM_BOOST_AMOUNT,
};

function sanitizeAmount(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.round(value * 100) / 100;
}

export async function getLivePricing(): Promise<LivePricingAmounts> {
  markDataFetchDynamic();

  try {
    const row = await prisma.pricingSetting.findUnique({
      where: { id: "default" },
    });

    if (!row) {
      return DEFAULT_LIVE_PRICING;
    }

    return {
      subscriptionAmount: sanitizeAmount(
        row.subscriptionAmount,
        DEFAULT_LIVE_PRICING.subscriptionAmount
      ),
      subscriptionPlusAmount: sanitizeAmount(
        row.subscriptionPlusAmount,
        DEFAULT_LIVE_PRICING.subscriptionPlusAmount
      ),
      extraWhatsappAmount: sanitizeAmount(
        row.extraWhatsappAmount,
        DEFAULT_LIVE_PRICING.extraWhatsappAmount
      ),
      extraAdAmount: sanitizeAmount(
        row.extraAdAmount,
        DEFAULT_LIVE_PRICING.extraAdAmount
      ),
      premiumBoostAmount: sanitizeAmount(
        row.premiumBoostAmount,
        DEFAULT_LIVE_PRICING.premiumBoostAmount
      ),
    };
  } catch {
    return DEFAULT_LIVE_PRICING;
  }
}

export async function updatePricingSettings(
  input: LivePricingAmounts
): Promise<LivePricingAmounts> {
  const data = {
    subscriptionAmount: sanitizeAmount(
      input.subscriptionAmount,
      DEFAULT_LIVE_PRICING.subscriptionAmount
    ),
    subscriptionPlusAmount: sanitizeAmount(
      input.subscriptionPlusAmount,
      DEFAULT_LIVE_PRICING.subscriptionPlusAmount
    ),
    extraWhatsappAmount: sanitizeAmount(
      input.extraWhatsappAmount,
      DEFAULT_LIVE_PRICING.extraWhatsappAmount
    ),
    extraAdAmount: sanitizeAmount(
      input.extraAdAmount,
      DEFAULT_LIVE_PRICING.extraAdAmount
    ),
    premiumBoostAmount: sanitizeAmount(
      input.premiumBoostAmount,
      DEFAULT_LIVE_PRICING.premiumBoostAmount
    ),
  };

  const row = await prisma.pricingSetting.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  return {
    subscriptionAmount: row.subscriptionAmount,
    subscriptionPlusAmount: row.subscriptionPlusAmount,
    extraWhatsappAmount: row.extraWhatsappAmount,
    extraAdAmount: row.extraAdAmount,
    premiumBoostAmount: row.premiumBoostAmount,
  };
}
