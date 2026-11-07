/** Normaliza nome de lugar para comparação (sem acento, minúsculo). */
export function normalizePlace(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Escolhe o melhor nome da lista conhecido que casa com o valor geocodificado.
 * Preferência: igualdade exata → um contém o outro.
 */
export function matchPlaceName(
  candidates: readonly string[],
  raw: string | undefined | null
): string | undefined {
  const needle = normalizePlace(raw ?? "");
  if (!needle || candidates.length === 0) return undefined;

  const exact = candidates.find((item) => normalizePlace(item) === needle);
  if (exact) return exact;

  const contained = candidates.find((item) => {
    const hay = normalizePlace(item);
    return hay.includes(needle) || needle.includes(hay);
  });

  return contained;
}

export function resolveCatalogPlace(input: {
  readonly cities: readonly string[];
  readonly neighborhoods: readonly string[];
  readonly geocodedCity?: string | null;
  readonly geocodedNeighborhood?: string | null;
}): {
  readonly city: string;
  readonly neighborhood: string;
} | null {
  const matchedCity =
    matchPlaceName(input.cities, input.geocodedCity) ??
    input.geocodedCity?.trim() ??
    "";

  if (!matchedCity) return null;

  const matchedNeighborhood =
    matchPlaceName(input.neighborhoods, input.geocodedNeighborhood) ??
    input.geocodedNeighborhood?.trim() ??
    "";

  return {
    city: matchedCity,
    neighborhood: matchedNeighborhood,
  };
}
