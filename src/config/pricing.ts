export const PRICING = {
  SUBSCRIPTION_AMOUNT: 10,
  /** Anúncios inclusos na mensalidade básica (por conta). */
  ADS_INCLUDED_PER_SUBSCRIPTION: 1,
  /** 2º WhatsApp no mesmo anúncio (máx. 2 contatos). */
  EXTRA_WHATSAPP_AMOUNT: 3,
  MAX_WHATSAPP_PER_AD: 2,
  /** Cada anúncio/filial extra além do incluso. */
  EXTRA_AD_AMOUNT: 10,
  PREMIUM_BOOST_AMOUNT: 5,
  SUBSCRIPTION_DAYS: 30,
  PREMIUM_BOOST_DAYS: 30,
  REFERRAL_PREMIUM_DAYS: 15,
  SUBSCRIPTION_RENEWAL_WINDOW_DAYS: 10,
  REFERRALS_PER_PREMIUM_CREDIT: 5,
  LAUNCH_TRIAL_DAYS: 30,
  PAYMENT_EXPIRATION_MINUTES: 30,
  PIX_KEY: "buscazapp@pagamentos.com.br",
} as const;

export function formatPriceBRL(amount: number): string {
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
}

export const PROVIDER_SESSION_COOKIE = "buscazapp_provider_id";

/** Cidades do piloto de lançamento. */
export const PILOT_CITIES = [
  { name: "Belém", state: "PA" },
  { name: "Ananindeua", state: "PA" },
] as const;

export function isPilotCity(city: string, state?: string): boolean {
  const normalizedCity = city.trim().toLowerCase();
  const normalizedState = state?.trim().toUpperCase();

  return PILOT_CITIES.some(
    (pilot) =>
      pilot.name.toLowerCase() === normalizedCity &&
      (!normalizedState || pilot.state === normalizedState)
  );
}
