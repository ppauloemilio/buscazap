import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import {
  ADVERTISEMENT_IMAGE_LIMITS,
  isAllowedImageMimeType,
} from "@/config/advertisement-images";

function sanitizeExtension(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  if (
    ADVERTISEMENT_IMAGE_LIMITS.allowedExtensions.includes(
      extension as (typeof ADVERTISEMENT_IMAGE_LIMITS.allowedExtensions)[number]
    )
  ) {
    return extension;
  }

  return ".jpg";
}

export function validateImageFile(file: File, label: string): string | null {
  if (!(file instanceof File) || file.size === 0) {
    return `${label} é obrigatória`;
  }

  if (!isAllowedImageMimeType(file.type)) {
    return `${label} deve ser JPG, PNG ou WebP`;
  }

  if (file.size > ADVERTISEMENT_IMAGE_LIMITS.maxFileSizeBytes) {
    return `${label} deve ter no máximo 5 MB`;
  }

  return null;
}

function canUseVercelBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export async function uploadAdvertisementImage(
  file: File,
  advertisementId: string,
  filenamePrefix: string
): Promise<string> {
  const extension = sanitizeExtension(file.name);
  const storagePath = `ads/${advertisementId}/${filenamePrefix}-${Date.now()}${extension}`;

  if (canUseVercelBlob()) {
    const blob = await put(storagePath, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return blob.url;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Upload de imagens não configurado. Conecte um Blob Store ao projeto na Vercel."
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "ads", advertisementId);
  await mkdir(uploadsDir, { recursive: true });
  const filename = `${filenamePrefix}-${Date.now()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return `/uploads/ads/${advertisementId}/${filename}`;
}

export function parseImageFiles(formData: FormData, fieldName: string): File[] {
  return formData
    .getAll(fieldName)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}
