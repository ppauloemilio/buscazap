/**
 * Freemium + novo perfil de anunciante (card/página/painel).
 * Desligar: NEXT_PUBLIC_NEW_AD_PROFILE=false (ou remova) + redeploy.
 */
export function isNewAdProfileEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NEW_AD_PROFILE === "true";
}
