import type { MetadataRoute } from "next";
import { AdvertisementStatus, ProviderStatus } from "@/domain/enums";
import { resolveCategorySlugByName } from "@/application/services/slug-service";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

const STATIC_PATHS = [
  "",
  "/buscar",
  "/categorias",
  "/anunciar",
  "/como-funciona",
  "/cadastro",
  "/entrar",
  "/ajuda",
  "/privacidade",
  "/termos",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/buscar" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const advertisements = await prisma.advertisement.findMany({
    where: {
      status: AdvertisementStatus.APPROVED,
      slug: { not: null },
      provider: { status: ProviderStatus.ACTIVE },
    },
    select: {
      slug: true,
      category: true,
      updatedAt: true,
    },
    take: 5000,
  });

  const categoryNames = [...new Set(advertisements.map((ad) => ad.category))];
  const categorySlugs = new Map<string, string>();
  await Promise.all(
    categoryNames.map(async (name) => {
      categorySlugs.set(name, await resolveCategorySlugByName(name));
    })
  );

  const categories = await prisma.catalogCategory.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}/buscar?categoria=${encodeURIComponent(category.slug)}`,
    lastModified: category.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const adEntries: MetadataRoute.Sitemap = advertisements
    .filter((ad) => Boolean(ad.slug))
    .map((ad) => ({
      url: `${base}/${categorySlugs.get(ad.category) ?? "geral"}/${ad.slug}`,
      lastModified: ad.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  return [...staticEntries, ...categoryEntries, ...adEntries];
}
