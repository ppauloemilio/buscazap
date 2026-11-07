/** Dimensões recomendadas dos banners patrocinados (carrossel da home). */
export const SPONSOR_BANNER_RECOMMENDATION = {
  /** Proporção larga, boa para faixa abaixo das categorias. */
  aspectRatioLabel: "3:1",
  widthPx: 1200,
  heightPx: 400,
  /** Intervalo do carrossel na home (ms). */
  rotateIntervalMs: 10_000,
} as const;

export function formatSponsorBannerSizeHint(): string {
  const { aspectRatioLabel, widthPx, heightPx } = SPONSOR_BANNER_RECOMMENDATION;
  return `Proporção ${aspectRatioLabel} (ideal ${widthPx}×${heightPx} px).`;
}
