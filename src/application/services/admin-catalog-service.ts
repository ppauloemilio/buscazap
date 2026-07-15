import { AdvertisementStatus } from "@/domain/enums";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/application/services/admin-service";
import {
  CategorySuggestionStatus,
  countCustomCategoryAdvertisements,
  formatCategoryDisplayName,
  registerCategorySuggestion,
  updateCustomCategoryAdvertisements,
} from "@/application/services/category-matching-service";
import { resolveCategorySlug } from "@/schemas/admin-catalog-schemas";

async function countCategoryUsage(name: string) {
  return prisma.advertisement.count({
    where: { category: name, status: AdvertisementStatus.APPROVED },
  });
}

async function countStateUsage(uf: string) {
  const [advertisements, providers] = await Promise.all([
    prisma.advertisement.count({ where: { state: uf } }),
    prisma.provider.count({ where: { state: uf } }),
  ]);

  return { advertisements, providers, total: advertisements + providers };
}

async function countCityUsage(name: string, uf: string) {
  return prisma.advertisement.count({
    where: { city: name, state: uf },
  });
}

export async function listAdminCategories() {
  const categories = await prisma.catalogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const grouped = await prisma.advertisement.groupBy({
    by: ["category"],
    _count: { category: true },
    where: { status: AdvertisementStatus.APPROVED },
  });
  const counts = new Map(
    grouped.map((item) => [item.category, item._count.category])
  );

  return categories.map((category) => ({
    ...category,
    advertisementsCount: counts.get(category.name) ?? 0,
  }));
}

export async function listAdminStates() {
  const states = await prisma.catalogState.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { cities: true } },
    },
  });

  const usage = await Promise.all(
    states.map(async (state) => ({
      id: state.id,
      usage: await countStateUsage(state.uf),
    }))
  );
  const usageMap = new Map(usage.map((item) => [item.id, item.usage]));

  return states.map((state) => ({
    id: state.id,
    uf: state.uf,
    name: state.name,
    isActive: state.isActive,
    sortOrder: state.sortOrder,
    citiesCount: state._count.cities,
    usageCount: usageMap.get(state.id)?.total ?? 0,
    createdAt: state.createdAt,
  }));
}

export async function listAdminCities(stateId?: string) {
  const cities = await prisma.catalogCity.findMany({
    where: stateId ? { stateId } : undefined,
    include: {
      state: { select: { uf: true, name: true } },
    },
    orderBy: [{ name: "asc" }],
  });

  const usage = await Promise.all(
    cities.map(async (city) => ({
      id: city.id,
      count: await countCityUsage(city.name, city.state.uf),
    }))
  );
  const usageMap = new Map(usage.map((item) => [item.id, item.count]));

  return cities.map((city) => ({
    id: city.id,
    name: city.name,
    stateId: city.stateId,
    stateUf: city.state.uf,
    stateName: city.state.name,
    isActive: city.isActive,
    usageCount: usageMap.get(city.id) ?? 0,
    createdAt: city.createdAt,
  }));
}

export async function createCategoryAsAdmin(input: {
  readonly adminId: string;
  readonly name: string;
  readonly slug?: string;
  readonly icon: string;
  readonly sortOrder: number;
}) {
  const slug = resolveCategorySlug(input.name, input.slug);

  const category = await prisma.catalogCategory.create({
    data: {
      name: input.name,
      slug,
      icon: input.icon,
      sortOrder: input.sortOrder,
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "CREATE_CATEGORY",
    entityType: "CatalogCategory",
    entityId: category.id,
    metadata: { name: category.name, slug: category.slug },
  });

  return category;
}

export async function updateCategoryAsAdmin(input: {
  readonly adminId: string;
  readonly id: string;
  readonly name: string;
  readonly slug?: string;
  readonly icon: string;
  readonly sortOrder: number;
  readonly isActive?: boolean;
}) {
  const current = await prisma.catalogCategory.findUnique({
    where: { id: input.id },
  });

  if (!current) {
    throw new Error("Categoria não encontrada");
  }

  const slug = resolveCategorySlug(input.name, input.slug);

  if (current.name !== input.name) {
    await prisma.advertisement.updateMany({
      where: { category: current.name },
      data: { category: input.name },
    });
  }

  const category = await prisma.catalogCategory.update({
    where: { id: input.id },
    data: {
      name: input.name,
      slug,
      icon: input.icon,
      sortOrder: input.sortOrder,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "UPDATE_CATEGORY",
    entityType: "CatalogCategory",
    entityId: category.id,
    metadata: { name: category.name, slug: category.slug, isActive: category.isActive },
  });

  return category;
}

export async function deleteCategoryAsAdmin(input: {
  readonly adminId: string;
  readonly id: string;
}) {
  const category = await prisma.catalogCategory.findUnique({
    where: { id: input.id },
  });

  if (!category) {
    throw new Error("Categoria não encontrada");
  }

  const usage = await countCategoryUsage(category.name);
  if (usage > 0) {
    throw new Error(
      `Não é possível excluir: ${usage} anúncio(s) usam esta categoria`
    );
  }

  await prisma.catalogCategory.delete({ where: { id: input.id } });

  await logAdminAction({
    adminId: input.adminId,
    action: "DELETE_CATEGORY",
    entityType: "CatalogCategory",
    entityId: category.id,
    metadata: { name: category.name },
  });
}

export async function createStateAsAdmin(input: {
  readonly adminId: string;
  readonly uf: string;
  readonly name: string;
  readonly sortOrder: number;
}) {
  const state = await prisma.catalogState.create({
    data: input,
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "CREATE_STATE",
    entityType: "CatalogState",
    entityId: state.id,
    metadata: { uf: state.uf, name: state.name },
  });

  return state;
}

export async function updateStateAsAdmin(input: {
  readonly adminId: string;
  readonly id: string;
  readonly uf: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly isActive?: boolean;
}) {
  const current = await prisma.catalogState.findUnique({
    where: { id: input.id },
  });

  if (!current) {
    throw new Error("Estado não encontrado");
  }

  if (current.uf !== input.uf) {
    const usage = await countStateUsage(current.uf);
    if (usage.total > 0) {
      throw new Error(
        "Não é possível alterar a UF: existem anúncios ou usuários vinculados"
      );
    }

    await prisma.advertisement.updateMany({
      where: { state: current.uf },
      data: { state: input.uf },
    });
    await prisma.provider.updateMany({
      where: { state: current.uf },
      data: { state: input.uf },
    });
  }

  if (current.name !== input.name) {
    // name change only affects catalog display
  }

  const state = await prisma.catalogState.update({
    where: { id: input.id },
    data: {
      uf: input.uf,
      name: input.name,
      sortOrder: input.sortOrder,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "UPDATE_STATE",
    entityType: "CatalogState",
    entityId: state.id,
    metadata: { uf: state.uf, name: state.name, isActive: state.isActive },
  });

  return state;
}

export async function bulkSetStatesActiveAsAdmin(input: {
  readonly adminId: string;
  readonly ids: readonly string[];
  readonly isActive: boolean;
}) {
  const uniqueIds = [...new Set(input.ids)].filter(Boolean);
  if (uniqueIds.length === 0) {
    throw new Error("Selecione ao menos um estado");
  }

  const result = await prisma.catalogState.updateMany({
    where: { id: { in: uniqueIds } },
    data: { isActive: input.isActive },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: input.isActive ? "BULK_ACTIVATE_STATES" : "BULK_DEACTIVATE_STATES",
    entityType: "CatalogState",
    metadata: {
      ids: uniqueIds,
      count: result.count,
      isActive: input.isActive,
    },
  });

  return result.count;
}

export async function deleteStateAsAdmin(input: {
  readonly adminId: string;
  readonly id: string;
}) {
  const state = await prisma.catalogState.findUnique({
    where: { id: input.id },
    include: { _count: { select: { cities: true } } },
  });

  if (!state) {
    throw new Error("Estado não encontrado");
  }

  const usage = await countStateUsage(state.uf);
  if (usage.total > 0) {
    throw new Error(
      `Não é possível excluir: ${usage.total} registro(s) usam este estado`
    );
  }

  if (state._count.cities > 0) {
    throw new Error("Exclua as cidades deste estado antes de removê-lo");
  }

  await prisma.catalogState.delete({ where: { id: input.id } });

  await logAdminAction({
    adminId: input.adminId,
    action: "DELETE_STATE",
    entityType: "CatalogState",
    entityId: state.id,
    metadata: { uf: state.uf, name: state.name },
  });
}

export async function createCityAsAdmin(input: {
  readonly adminId: string;
  readonly name: string;
  readonly stateId: string;
}) {
  const state = await prisma.catalogState.findUnique({
    where: { id: input.stateId },
  });

  if (!state) {
    throw new Error("Estado não encontrado");
  }

  const city = await prisma.catalogCity.create({
    data: {
      name: input.name,
      stateId: input.stateId,
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "CREATE_CITY",
    entityType: "CatalogCity",
    entityId: city.id,
    metadata: { name: city.name, uf: state.uf },
  });

  return city;
}

export async function updateCityAsAdmin(input: {
  readonly adminId: string;
  readonly id: string;
  readonly name: string;
  readonly stateId: string;
  readonly isActive?: boolean;
}) {
  const current = await prisma.catalogCity.findUnique({
    where: { id: input.id },
    include: { state: { select: { uf: true } } },
  });

  if (!current) {
    throw new Error("Cidade não encontrada");
  }

  const nextState = await prisma.catalogState.findUnique({
    where: { id: input.stateId },
  });

  if (!nextState) {
    throw new Error("Estado não encontrado");
  }

  if (current.name !== input.name || current.state.uf !== nextState.uf) {
    const usage = await countCityUsage(current.name, current.state.uf);
    if (usage > 0) {
      await prisma.advertisement.updateMany({
        where: { city: current.name, state: current.state.uf },
        data: { city: input.name, state: nextState.uf },
      });
    }
  }

  const city = await prisma.catalogCity.update({
    where: { id: input.id },
    data: {
      name: input.name,
      stateId: input.stateId,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "UPDATE_CITY",
    entityType: "CatalogCity",
    entityId: city.id,
    metadata: {
      name: city.name,
      uf: nextState.uf,
      isActive: city.isActive,
    },
  });

  return city;
}

export async function bulkSetCitiesActiveAsAdmin(input: {
  readonly adminId: string;
  readonly ids: readonly string[];
  readonly isActive: boolean;
}) {
  const uniqueIds = [...new Set(input.ids)].filter(Boolean);
  if (uniqueIds.length === 0) {
    throw new Error("Selecione ao menos uma cidade");
  }

  const result = await prisma.catalogCity.updateMany({
    where: { id: { in: uniqueIds } },
    data: { isActive: input.isActive },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: input.isActive ? "BULK_ACTIVATE_CITIES" : "BULK_DEACTIVATE_CITIES",
    entityType: "CatalogCity",
    metadata: {
      ids: uniqueIds,
      count: result.count,
      isActive: input.isActive,
    },
  });

  return result.count;
}

export async function deleteCityAsAdmin(input: {
  readonly adminId: string;
  readonly id: string;
}) {
  const city = await prisma.catalogCity.findUnique({
    where: { id: input.id },
    include: { state: { select: { uf: true } } },
  });

  if (!city) {
    throw new Error("Cidade não encontrada");
  }

  const usage = await countCityUsage(city.name, city.state.uf);
  if (usage > 0) {
    throw new Error(
      `Não é possível excluir: ${usage} anúncio(s) usam esta cidade`
    );
  }

  await prisma.catalogCity.delete({ where: { id: input.id } });

  await logAdminAction({
    adminId: input.adminId,
    action: "DELETE_CITY",
    entityType: "CatalogCity",
    entityId: city.id,
    metadata: { name: city.name, uf: city.state.uf },
  });
}

export async function getAdminCustomCategories() {
  return listPendingCategorySuggestions();
}

async function syncCategorySuggestionsFromAdvertisements() {
  const customCategories = await prisma.advertisement.groupBy({
    by: ["category"],
    where: { isCustomCategory: true },
  });

  for (const item of customCategories) {
    await registerCategorySuggestion(item.category);
  }
}

export async function listPendingCategorySuggestions() {
  await syncCategorySuggestionsFromAdvertisements();

  const suggestions = await prisma.categorySuggestion.findMany({
    where: { status: CategorySuggestionStatus.PENDING },
    orderBy: [{ updatedAt: "desc" }],
  });

  const withCounts = await Promise.all(
    suggestions.map(async (suggestion) => ({
      id: suggestion.id,
      name: suggestion.name,
      normalizedKey: suggestion.normalizedKey,
      status: suggestion.status,
      advertisementsCount: await countCustomCategoryAdvertisements(
        suggestion.name,
        suggestion.normalizedKey
      ),
      createdAt: suggestion.createdAt,
      updatedAt: suggestion.updatedAt,
    }))
  );

  return withCounts.sort((a, b) => b.advertisementsCount - a.advertisementsCount);
}

export async function promoteCategorySuggestionAsAdmin(input: {
  readonly adminId: string;
  readonly suggestionId: string;
  readonly name: string;
  readonly slug?: string;
  readonly icon: string;
  readonly sortOrder: number;
}) {
  const suggestion = await prisma.categorySuggestion.findUnique({
    where: { id: input.suggestionId },
  });

  if (!suggestion || suggestion.status !== CategorySuggestionStatus.PENDING) {
    throw new Error("Sugestão não encontrada ou já processada");
  }

  const displayName = formatCategoryDisplayName(input.name);
  const slug = resolveCategorySlug(displayName, input.slug);

  const existingCategory = await prisma.catalogCategory.findFirst({
    where: {
      OR: [{ name: displayName }, { slug }],
    },
  });

  if (existingCategory) {
    throw new Error("Já existe uma categoria oficial com este nome ou identificador");
  }

  const category = await prisma.catalogCategory.create({
    data: {
      name: displayName,
      slug,
      icon: input.icon,
      sortOrder: input.sortOrder,
    },
  });

  await updateCustomCategoryAdvertisements({
    normalizedKey: suggestion.normalizedKey,
    categoryName: category.name,
    isCustomCategory: false,
  });

  await prisma.categorySuggestion.update({
    where: { id: suggestion.id },
    data: {
      status: CategorySuggestionStatus.PROMOTED,
      name: displayName,
      mergedIntoName: category.name,
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "PROMOTE_CATEGORY_SUGGESTION",
    entityType: "CategorySuggestion",
    entityId: suggestion.id,
    metadata: {
      suggestionName: suggestion.name,
      categoryName: category.name,
      slug: category.slug,
    },
  });

  return category;
}

export async function mergeCategorySuggestionAsAdmin(input: {
  readonly adminId: string;
  readonly suggestionId: string;
  readonly targetCategoryId: string;
}) {
  const [suggestion, targetCategory] = await Promise.all([
    prisma.categorySuggestion.findUnique({ where: { id: input.suggestionId } }),
    prisma.catalogCategory.findUnique({ where: { id: input.targetCategoryId } }),
  ]);

  if (!suggestion || suggestion.status !== CategorySuggestionStatus.PENDING) {
    throw new Error("Sugestão não encontrada ou já processada");
  }

  if (!targetCategory) {
    throw new Error("Categoria oficial de destino não encontrada");
  }

  await updateCustomCategoryAdvertisements({
    normalizedKey: suggestion.normalizedKey,
    categoryName: targetCategory.name,
    isCustomCategory: false,
  });

  await prisma.categorySuggestion.update({
    where: { id: suggestion.id },
    data: {
      status: CategorySuggestionStatus.MERGED,
      mergedIntoName: targetCategory.name,
    },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "MERGE_CATEGORY_SUGGESTION",
    entityType: "CategorySuggestion",
    entityId: suggestion.id,
    metadata: {
      suggestionName: suggestion.name,
      mergedIntoName: targetCategory.name,
    },
  });
}

export async function dismissCategorySuggestionAsAdmin(input: {
  readonly adminId: string;
  readonly suggestionId: string;
}) {
  const suggestion = await prisma.categorySuggestion.findUnique({
    where: { id: input.suggestionId },
  });

  if (!suggestion || suggestion.status !== CategorySuggestionStatus.PENDING) {
    throw new Error("Sugestão não encontrada ou já processada");
  }

  await prisma.categorySuggestion.update({
    where: { id: suggestion.id },
    data: { status: CategorySuggestionStatus.DISMISSED },
  });

  await logAdminAction({
    adminId: input.adminId,
    action: "DISMISS_CATEGORY_SUGGESTION",
    entityType: "CategorySuggestion",
    entityId: suggestion.id,
    metadata: { suggestionName: suggestion.name },
  });
}
