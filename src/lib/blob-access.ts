export type BlobAccessType = "public" | "private";

export function getBlobAccessType(): BlobAccessType {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}

export function isVercelBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function isPrivateBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes(".private.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Proxy local para Blob (público ou privado) — evita CORS e autenticação no browser. */
export function resolveAdvertisementImageUrl(storedUrl: string): string {
  if (!storedUrl) {
    return storedUrl;
  }

  if (storedUrl.startsWith("/api/media")) {
    return storedUrl;
  }

  if (storedUrl.startsWith("/")) {
    return storedUrl;
  }

  if (isVercelBlobUrl(storedUrl)) {
    return `/api/media?url=${encodeURIComponent(storedUrl)}`;
  }

  return storedUrl;
}

/**
 * URLs do proxy /api/media (e blobs crus) não funcionam com o otimizador
 * /_next/image — use unoptimized ou <img>.
 */
export function shouldSkipImageOptimization(url: string): boolean {
  return (
    url.startsWith("/api/media") ||
    url.includes("/api/media?") ||
    isVercelBlobUrl(url)
  );
}
