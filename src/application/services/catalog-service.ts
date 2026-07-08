import type { Category } from "@/domain/entities";
import { AdvertisementStatus } from "@/domain/enums";
import { prisma } from "@/lib/prisma";
import { markDataFetchDynamic } from "@/lib/db";

export async function listActiveCategories() {
  markDataFetchDynamic();

  return prisma.catalogCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listAllCategories() {
  return prisma.catalogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.catalogCategory.findFirst({
    where: {
      slug,
      isActive: true,
    },
  });
}

export async function getCategoryNameBySlug(slug: string) {
  const category = await getCategoryBySlug(slug);
  return category?.name;
}

export async function listActiveStates() {
  markDataFetchDynamic();

  return prisma.catalogState.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listAllStates() {
  return prisma.catalogState.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listActiveCities(stateId?: string) {
  markDataFetchDynamic();

  return prisma.catalogCity.findMany({
    where: {
      isActive: true,
      ...(stateId ? { stateId } : {}),
    },
    include: {
      state: {
        select: { uf: true, name: true },
      },
    },
    orderBy: [{ name: "asc" }],
  });
}

export async function listAllCities(stateId?: string) {
  return prisma.catalogCity.findMany({
    where: stateId ? { stateId } : undefined,
    include: {
      state: {
        select: { uf: true, name: true },
      },
    },
    orderBy: [{ name: "asc" }],
  });
}

export async function listCityNamesForSearch() {
  const cities = await listActiveCities();
  return cities.map((city) => city.name);
}

export async function getCategoriesWithCounts(): Promise<Category[]> {
  const [categories, grouped] = await Promise.all([
    listActiveCategories(),
    prisma.advertisement.groupBy({
      by: ["category"],
      _count: { category: true },
      where: { status: AdvertisementStatus.APPROVED },
    }),
  ]);

  const counts = new Map(
    grouped.map((item) => [item.category, item._count.category])
  );

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    count: counts.get(category.name) ?? 0,
  }));
}

export async function getCatalogStats() {
  const [categoriesCount, statesCount, citiesCount] = await Promise.all([
    prisma.catalogCategory.count({ where: { isActive: true } }),
    prisma.catalogState.count({ where: { isActive: true } }),
    prisma.catalogCity.count({ where: { isActive: true } }),
  ]);

  return {
    categoriesCount,
    statesCount,
    citiesCount,
  };
}
