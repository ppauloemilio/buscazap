import type { MetadataRoute } from "next";
import {
  buildCategoryCitySeoPath,
  buildCitySeoPath,
  listActiveSeoCities,
} from "@/application/services/city-seo-service";
import { prisma } from "@/lib/prisma";
import { publicListingAdvertisementWhere } from "@/lib/public-advertisement-visibility";
import { getSiteUrl } from "@/lib/site-url";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "",
  "/buscar",
  "/categorias",
  "/cidades",
  "/anunciar",
  "/como-funciona",
  "/cadastro",
  "/entrar",
  "/ajuda",
  "/quem-somos",
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

  const [advertisements, categories, seoCities, cityCategoryGrouped] =
    await Promise.all([
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
      listActiveSeoCities(),
      prisma.advertisement.groupBy({
        by: ["city", "category"],
        where: publicListingAdvertisementWhere(now),
        _max: { updatedAt: true },
      }),
    ]);

  const categorySlugByName = new Map(
    categories.map((category) => [category.name, category.slug])
  );

  const citySlugByName = new Map(
    seoCities.map((city) => [city.name.toLowerCase(), city.slug])
  );

  const cityEntries: MetadataRoute.Sitemap = seoCities.map((city) => ({
    url: `${base}${buildCitySeoPath(city.slug)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}/buscar?category=${encodeURIComponent(category.slug)}`,
    lastModified: category.updatedAt,
    changeFrequency: "daily",
    priority: 0.75,
  }));

  const cityCategoryEntries: MetadataRoute.Sitemap = [];

  for (const row of cityCategoryGrouped) {
    const citySlug = citySlugByName.get(row.city.trim().toLowerCase());
    const categorySlug = categorySlugByName.get(row.category);
    if (!citySlug || !categorySlug) continue;

    cityCategoryEntries.push({
      url: `${base}${buildCategoryCitySeoPath(citySlug, categorySlug)}`,
      lastModified: row._max.updatedAt ?? now,
      changeFrequency: "daily",
      priority: 0.88,
    });
  }

  const adEntries: MetadataRoute.Sitemap = advertisements
    .filter((ad) => Boolean(ad.slug))
    .map((ad) => ({
      url: `${base}/${categorySlugByName.get(ad.category) ?? (slugify(ad.category) || "geral")}/${ad.slug}`,
      lastModified: ad.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  return [
    ...staticEntries,
    ...cityEntries,
    ...categoryEntries,
    ...cityCategoryEntries,
    ...adEntries,
  ];
}
