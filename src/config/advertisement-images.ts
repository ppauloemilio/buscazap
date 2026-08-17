export const ADVERTISEMENT_IMAGE_KIND = {
  COVER: "COVER",
  GALLERY: "GALLERY",
} as const;

export const ADVERTISEMENT_IMAGE_LIMITS = {
  /** Limite por arquivo (alinhado ao teto prático de upload na Vercel ~4,5 MB). */
  maxFileSizeBytes: 4 * 1024 * 1024,
  /** Soma máxima de todos os arquivos em um único envio. */
  maxRequestBytes: 4 * 1024 * 1024,
  maxGalleryImages: 5,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
} as const;

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
