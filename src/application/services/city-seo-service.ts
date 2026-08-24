import { listActiveCities, getCategoryBySlug } from "@/application/services/catalog-service";
import { slugify } from "@/lib/slug";

export type SeoCity = {
  readonly slug: string;
  readonly name: string;
  readonly stateUf: string;
  readonly stateName: string;
};

export function cityNameToSlug(name: string): string {
  return slugify(name);
}

export function buildCitySeoPath(citySlug: string): string {
  return `/${citySlug}`;
}

export function buildCategoryCitySeoPath(
  citySlug: string,
  categorySlug: string
): string {
  return `/${citySlug}/${categorySlug}`;
}

export async function listActiveSeoCities(): Promise<readonly SeoCity[]> {
  const cities = await listActiveCities();

  return cities
    .map((city) => ({
      slug: cityNameToSlug(city.name),
      name: city.name,
      stateUf: city.state.uf,
      stateName: city.state.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function getActiveSeoCityBySlug(
  slug: string
): Promise<SeoCity | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const cities = await listActiveSeoCities();
  return cities.find((city) => city.slug === normalized) ?? null;
}

export async function resolveCategoryCityLanding(
  citySlug: string,
  categorySlug: string
) {
  const city = await getActiveSeoCityBySlug(citySlug);
  if (!city) return null;

  const category = await getCategoryBySlug(categorySlug);
  if (!category) return null;

  return { city, category };
}
