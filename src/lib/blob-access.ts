export type BlobAccessType = "public" | "private";

export function getBlobAccessType(): BlobAccessType {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}

export function isPrivateBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes(".private.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function resolveAdvertisementImageUrl(storedUrl: string): string {
  if (storedUrl.startsWith("/")) {
    return storedUrl;
  }

  if (isPrivateBlobUrl(storedUrl)) {
    return `/api/media?url=${encodeURIComponent(storedUrl)}`;
  }

  return storedUrl;
}
