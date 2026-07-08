import { CATEGORY_OTHER_VALUE } from "@/config/advertisement-form";
import { slugify } from "@/lib/slugify";
import { prisma } from "@/lib/prisma";

export const CategorySuggestionStatus = {
  PENDING: "PENDING",
  PROMOTED: "PROMOTED",
  MERGED: "MERGED",
  DISMISSED: "DISMISSED",
} as const;

export function normalizeCategoryKey(name: string): string {
  return slugify(name.trim());
}

export function formatCategoryDisplayName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function findMatchingCatalogCategory(
  input: string,
  categories: ReadonlyArray<{ readonly name: string; readonly slug: string }>
) {
  const key = normalizeCategoryKey(input);

  if (!key) {
    return null;
  }

  return (
    categories.find(
      (category) =>
        normalizeCategoryKey(category.name) === key || category.slug === key
    ) ?? null
  );
}

export async function resolveAdvertisementCategoryFromCatalog(input: {
  readonly category: string;
  readonly customCategory?: string;
}) {
  const catalogCategories = await prisma.catalogCategory.findMany({
    where: { isActive: true },
    select: { name: true, slug: true },
  });

  if (input.category !== CATEGORY_OTHER_VALUE) {
    const selected = findMatchingCatalogCategory(input.category, catalogCategories);
    return {
      categoryName: selected?.name ?? input.category,
      isCustomCategory: false,
      wasAutoMatched: Boolean(selected),
    };
  }

  const rawCustom = input.customCategory?.trim() ?? "";
  const displayName = formatCategoryDisplayName(rawCustom);
  const matched = findMatchingCatalogCategory(displayName, catalogCategories);

  if (matched) {
    return {
      categoryName: matched.name,
      isCustomCategory: false,
      wasAutoMatched: true,
    };
  }

  return {
    categoryName: displayName,
    isCustomCategory: true,
    wasAutoMatched: false,
  };
}

export async function registerCategorySuggestion(name: string) {
  const displayName = formatCategoryDisplayName(name);
  const normalizedKey = normalizeCategoryKey(displayName);

  if (!normalizedKey) {
    return null;
  }

  const existing = await prisma.categorySuggestion.findUnique({
    where: { normalizedKey },
  });

  if (existing?.status === CategorySuggestionStatus.PENDING) {
    return existing;
  }

  if (
    existing &&
    (existing.status === CategorySuggestionStatus.DISMISSED ||
      existing.status === CategorySuggestionStatus.MERGED ||
      existing.status === CategorySuggestionStatus.PROMOTED)
  ) {
    return prisma.categorySuggestion.update({
      where: { id: existing.id },
      data: {
        name: displayName,
        status: CategorySuggestionStatus.PENDING,
        mergedIntoName: null,
      },
    });
  }

  return prisma.categorySuggestion.upsert({
    where: { normalizedKey },
    create: {
      name: displayName,
      normalizedKey,
      status: CategorySuggestionStatus.PENDING,
    },
    update: {
      name: displayName,
    },
  });
}

export async function countCustomCategoryAdvertisements(
  categoryName: string,
  normalizedKey?: string
) {
  const key = normalizedKey ?? normalizeCategoryKey(categoryName);
  const advertisements = await prisma.advertisement.findMany({
    where: { isCustomCategory: true },
    select: { id: true, category: true },
  });

  return advertisements.filter(
    (advertisement) => normalizeCategoryKey(advertisement.category) === key
  ).length;
}

export async function updateCustomCategoryAdvertisements(input: {
  readonly normalizedKey: string;
  readonly categoryName: string;
  readonly isCustomCategory: boolean;
}) {
  const advertisements = await prisma.advertisement.findMany({
    where: { isCustomCategory: true },
    select: { id: true, category: true },
  });

  const ids = advertisements
    .filter(
      (advertisement) =>
        normalizeCategoryKey(advertisement.category) === input.normalizedKey
    )
    .map((advertisement) => advertisement.id);

  if (ids.length === 0) {
    return 0;
  }

  await prisma.advertisement.updateMany({
    where: { id: { in: ids } },
    data: {
      category: input.categoryName,
      isCustomCategory: input.isCustomCategory,
    },
  });

  return ids.length;
}
