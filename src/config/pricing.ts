export const PRICING = {
  SUBSCRIPTION_AMOUNT: 10,
  PREMIUM_BOOST_AMOUNT: 5,
  SUBSCRIPTION_DAYS: 30,
  PREMIUM_BOOST_DAYS: 30,
  REFERRAL_PREMIUM_DAYS: 15,
  SUBSCRIPTION_RENEWAL_WINDOW_DAYS: 10,
  REFERRALS_PER_PREMIUM_CREDIT: 5,
  LAUNCH_TRIAL_DAYS: 30,
  PAYMENT_EXPIRATION_MINUTES: 30,
  PIX_KEY: "buscazap@pagamentos.com.br",
} as const;

export const PROVIDER_SESSION_COOKIE = "buscazap_provider_id";

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
