export const ADVERTISEMENT_IMAGE_KIND = {
  COVER: "COVER",
  GALLERY: "GALLERY",
} as const;

export const ADVERTISEMENT_IMAGE_LIMITS = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxGalleryImages: 5,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
} as const;

export function isAllowedImageMimeType(mimeType: string): boolean {
  return ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes.includes(
    mimeType as (typeof ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes)[number]
  );
}
