import { prisma } from "@/lib/prisma";
import type { CatalogLocationOption } from "@/shared/utils/catalog-location";

export type { CatalogLocationOption } from "@/shared/utils/catalog-location";
export { getDefaultCatalogLocation } from "@/shared/utils/catalog-location";

function normalizeLocationText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Confirma se cidade + UF existem e estão ativos no catálogo admin.
 * Retorna mensagem de erro ou null se válido.
 */
export async function getCatalogLocationError(
  city: string,
  state: string
): Promise<string | null> {
  const uf = state.trim().toUpperCase();
  const cityName = city.trim();

  if (!cityName || uf.length !== 2) {
    return "Informe cidade e UF válidos";
  }

  const catalogState = await prisma.catalogState.findFirst({
    where: { uf, isActive: true },
    select: { id: true },
  });

  if (!catalogState) {
    return "UF não disponível no momento. Escolha um estado ativo no catálogo.";
  }

  const cities = await prisma.catalogCity.findMany({
    where: { stateId: catalogState.id, isActive: true },
    select: { name: true },
  });

  const expected = normalizeLocationText(cityName);
  const matched = cities.some(
    (item) => normalizeLocationText(item.name) === expected
  );

  if (!matched) {
    return "Cidade não disponível nesta UF. Escolha uma cidade ativa no catálogo.";
  }

  return null;
}

export async function listActiveCatalogLocationOptions(): Promise<{
  readonly states: readonly { readonly uf: string; readonly name: string }[];
  readonly cities: readonly CatalogLocationOption[];
}> {
  const [states, cities] = await Promise.all([
    prisma.catalogState.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { uf: true, name: true },
    }),
    prisma.catalogCity.findMany({
      where: { isActive: true },
      include: { state: { select: { uf: true } } },
      orderBy: [{ name: "asc" }],
    }),
  ]);

  return {
    states: states.map((state) => ({ uf: state.uf, name: state.name })),
    cities: cities.map((city) => ({
      name: city.name,
      state: city.state.uf,
    })),
  };
}
