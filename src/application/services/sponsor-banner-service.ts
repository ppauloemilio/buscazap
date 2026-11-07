import { prisma } from "@/lib/prisma";
import { markDataFetchDynamic } from "@/lib/db";

export type SponsorBannerRecord = {
  readonly id: string;
  readonly title: string;
  readonly imageUrl: string;
  readonly linkUrl: string | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

function mapBanner(row: {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SponsorBannerRecord {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listSponsorBannersForAdmin(): Promise<
  readonly SponsorBannerRecord[]
> {
  markDataFetchDynamic();

  const rows = await prisma.sponsorBanner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return rows.map(mapBanner);
}

/** Banners ativos para o carrossel público da home. */
export async function listActiveSponsorBanners(): Promise<
  readonly SponsorBannerRecord[]
> {
  markDataFetchDynamic();

  try {
    const rows = await prisma.sponsorBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(mapBanner);
  } catch {
    return [];
  }
}

export async function createSponsorBanner(input: {
  readonly title: string;
  readonly imageUrl: string;
  readonly linkUrl?: string | null;
  readonly sortOrder?: number;
  readonly isActive?: boolean;
}): Promise<SponsorBannerRecord> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Informe o nome do patrocinador ou título do banner.");
  }

  let sortOrder = input.sortOrder;
  if (sortOrder == null || !Number.isFinite(sortOrder)) {
    const max = await prisma.sponsorBanner.aggregate({
      _max: { sortOrder: true },
    });
    sortOrder = (max._max.sortOrder ?? -1) + 1;
  }

  const row = await prisma.sponsorBanner.create({
    data: {
      title,
      imageUrl: input.imageUrl,
      linkUrl: normalizeOptionalUrl(input.linkUrl),
      sortOrder,
      isActive: input.isActive ?? true,
    },
  });

  return mapBanner(row);
}

export async function updateSponsorBanner(input: {
  readonly id: string;
  readonly title: string;
  readonly linkUrl?: string | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly imageUrl?: string;
}): Promise<SponsorBannerRecord> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Informe o nome do patrocinador ou título do banner.");
  }

  const row = await prisma.sponsorBanner.update({
    where: { id: input.id },
    data: {
      title,
      linkUrl: normalizeOptionalUrl(input.linkUrl),
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
    },
  });

  return mapBanner(row);
}

export async function deleteSponsorBanner(id: string): Promise<void> {
  await prisma.sponsorBanner.delete({ where: { id } });
}

function normalizeOptionalUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid");
    }
    return url.toString();
  } catch {
    throw new Error("Link inválido. Use uma URL completa (https://...).");
  }
}
