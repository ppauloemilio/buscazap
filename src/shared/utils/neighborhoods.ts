import { normalizePlace } from "@/shared/utils/place-match";

export function neighborhoodsForCity(
  groups: ReadonlyArray<{
    readonly city: string;
    readonly neighborhoods: readonly string[];
  }>,
  city: string
): readonly string[] {
  const trimmed = city.trim();
  if (!trimmed) return [];

  const exact = groups.find((group) => group.city === trimmed);
  if (exact) return exact.neighborhoods;

  const query = normalizePlace(trimmed);
  const match = groups.find(
    (group) =>
      normalizePlace(group.city).includes(query) ||
      query.includes(normalizePlace(group.city))
  );

  return match?.neighborhoods ?? [];
}
