import { PRICING } from "@/config/pricing";

export const ADVERTISEMENT_IMAGE_KIND = {
  COVER: "COVER",
  LOGO: "LOGO",
  GALLERY: "GALLERY",
} as const;

export const ADVERTISEMENT_IMAGE_LIMITS = {
  /** Limite por arquivo (alinhado ao teto prático de upload na Vercel ~4,5 MB). */
  maxFileSizeBytes: 4 * 1024 * 1024,
  /** Soma máxima de todos os arquivos em um único envio. */
  maxRequestBytes: 4 * 1024 * 1024,
  /** Máx. de arquivos por envio (batch). Preferir getMax* helpers. */
  maxGalleryImages: 9,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
} as const;

/** Limite de fotos GALLERY no anúncio (só premium no freemium). */
export function getMaxAdGalleryImages(input: {
  readonly premiumActive: boolean;
}): number {
  return input.premiumActive ? PRICING.PREMIUM_AD_GALLERY : 0;
}

/** @deprecated Prefer getMaxAdGalleryImages + fotos da empresa no perfil */
export function getMaxGalleryImages(input: {
  readonly paidActive: boolean;
  readonly premiumActive: boolean;
}): number {
  if (!input.paidActive) {
    return 0;
  }

  return input.premiumActive
    ? PRICING.PREMIUM_AD_GALLERY
    : 0;
}

/** @deprecated Use getMaxGalleryImages */
export function getMaxAdvertisementImages(input: {
  readonly paidActive: boolean;
  readonly premiumActive: boolean;
}): number {
  return getMaxGalleryImages(input);
}

export function isAllowedImageMimeType(mimeType: string): boolean {
  return ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes.includes(
    mimeType as (typeof ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes)[number]
  );
}

export function isAllowedImageExtension(filename: string): boolean {
  const extension = filename.includes(".")
    ? `.${filename.split(".").pop()?.toLowerCase() ?? ""}`
    : "";
  return ADVERTISEMENT_IMAGE_LIMITS.allowedExtensions.includes(
    extension as (typeof ADVERTISEMENT_IMAGE_LIMITS.allowedExtensions)[number]
  );
}
