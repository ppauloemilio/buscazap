import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function ensureUniqueAdvertisementSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(title) || "anuncio";
  let candidate = base;
  let attempt = 0;

  while (attempt < 50) {
    const existing = await prisma.advertisement.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt + 1}`;
  }

  return `${base}-${Date.now().toString(36)}`;
}

export async function resolveCategorySlugByName(
  categoryName: string
): Promise<string> {
  const category = await prisma.catalogCategory.findFirst({
    where: { name: categoryName, isActive: true },
    select: { slug: true },
  });

  if (category?.slug) {
    return category.slug;
  }

  return slugify(categoryName) || "geral";
}

export async function buildAdvertisementHref(input: {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly slug?: string | null;
}): Promise<string> {
  const categorySlug = await resolveCategorySlugByName(input.category);
  const adSlug =
    input.slug?.trim() ||
    (await ensureUniqueAdvertisementSlug(input.title, input.id));

  if (!input.slug?.trim()) {
    await prisma.advertisement
      .update({
        where: { id: input.id },
        data: { slug: adSlug },
      })
      .catch(() => null);
  }

  return `/${categorySlug}/${adSlug}`;
}
