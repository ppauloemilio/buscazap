import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { publicListingAdvertisementWhere } from "@/lib/public-advertisement-visibility";
import { getSiteUrl } from "@/lib/site-url";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

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

  const [advertisements, categories] = await Promise.all([
    prisma.advertisement.findMany({
      where: {
        slug: { not: null },
        ...publicListingAdvertisementWhere(now),
      },
      select: {
        slug: true,
        category: true,
        updatedAt: true,
      },
      take: 5000,
    }),
    prisma.catalogCategory.findMany({
      where: { isActive: true },
      select: { name: true, slug: true, updatedAt: true },
    }),
  ]);

  const categorySlugs = new Map(
    categories.map((category) => [category.name, category.slug])
  );

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}/buscar?categoria=${encodeURIComponent(category.slug)}`,
    lastModified: category.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const adEntries: MetadataRoute.Sitemap = advertisements
    .filter((ad) => Boolean(ad.slug))
    .map((ad) => ({
      url: `${base}/${categorySlugs.get(ad.category) ?? (slugify(ad.category) || "geral")}/${ad.slug}`,
      lastModified: ad.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  return [...staticEntries, ...categoryEntries, ...adEntries];
}
