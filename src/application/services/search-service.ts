import type { AdvertisementType } from "@/domain/enums";
import type { Advertisement, SearchFilters } from "@/domain/entities";
import {
  findAdvertisementById,
  findAdvertisementByCategoryAndSlug,
  findPublicAdvertisements,
  getCategoryNameBySlug,
} from "@/application/services/advertisement-service";

export async function searchAdvertisements(
  filters: SearchFilters & {
    readonly premium?: boolean;
    readonly sort?: string;
    readonly knownCategorySlugs?:
      | ReadonlyMap<string, string>
      | Readonly<Record<string, string>>;
  }
): Promise<readonly Advertisement[]> {
  return findPublicAdvertisements(filters);
}

export async function getAdvertisementById(
  id: string
): Promise<Advertisement | undefined> {
  return findAdvertisementById(id);
}

export async function getAdvertisementByCategoryAndSlug(
  categorySlug: string,
  adSlug: string
): Promise<Advertisement | undefined> {
  return findAdvertisementByCategoryAndSlug(categorySlug, adSlug);
}

export { getCategoryNameBySlug };

export function getTypeLabel(type: AdvertisementType): string {
  const labels: Record<AdvertisementType, string> = {
    PROFESSIONAL: "Profissionais",
    COMPANY: "Empresas",
    PRODUCT: "Produtos",
    SERVICE: "Serviços",
  };
  return labels[type];
}
