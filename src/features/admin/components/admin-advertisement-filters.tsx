import Link from "next/link";
import { Filter, X } from "lucide-react";
import { ADMIN_AD_STATUS_OPTIONS } from "@/config/admin";
import { ADVERTISEMENT_TYPE_OPTIONS } from "@/config/advertisement-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AdminAdvertisementFiltersState {
  readonly q?: string;
  readonly status?: string;
  readonly category?: string;
  readonly city?: string;
  readonly type?: string;
  readonly published?: string;
  readonly premium?: string;
  readonly providerId?: string;
}

interface AdminAdvertisementFiltersProps {
  readonly filters: AdminAdvertisementFiltersState;
  readonly categories: readonly { readonly name: string }[];
  readonly cities: readonly string[];
  readonly resultCount: number;
}

function buildHref(filters: AdminAdvertisementFiltersState): string {
  const params = new URLSearchParams();

  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.status?.trim()) params.set("status", filters.status.trim());
  if (filters.category?.trim()) params.set("category", filters.category.trim());
  if (filters.city?.trim()) params.set("city", filters.city.trim());
  if (filters.type?.trim()) params.set("type", filters.type.trim());
  if (filters.published?.trim()) params.set("published", filters.published.trim());
  if (filters.premium === "1") params.set("premium", "1");
  if (filters.providerId?.trim()) params.set("providerId", filters.providerId.trim());

  const qs = params.toString();
  return qs ? `/admin/anuncios?${qs}` : "/admin/anuncios";
}

function hasActiveFilters(filters: AdminAdvertisementFiltersState): boolean {
  return Boolean(
    filters.q?.trim() ||
      filters.status?.trim() ||
      filters.category?.trim() ||
      filters.city?.trim() ||
      filters.type?.trim() ||
      filters.published?.trim() ||
      filters.premium === "1"
  );
}

export function AdminAdvertisementFilters({
  filters,
  categories,
  cities,
  resultCount,
}: AdminAdvertisementFiltersProps) {
  const active = hasActiveFilters(filters);

  return (
    <div className="mb-4 space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4 text-whatsapp" />
          Filtros
        </div>
        <p className="text-xs text-muted-foreground">
          {resultCount} anúncio{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      <form action="/admin/anuncios" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Buscar título, anunciante ou WhatsApp"
          className="h-9 text-sm sm:col-span-2 lg:col-span-2"
        />

        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Todos os status</option>
          {ADMIN_AD_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          name="published"
          defaultValue={filters.published ?? ""}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Publicação (todos)</option>
          <option value="yes">Publicado na busca</option>
          <option value="no">Não publicado na busca</option>
        </select>

        <select
          name="category"
          defaultValue={filters.category ?? ""}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.name} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          name="city"
          defaultValue={filters.city ?? ""}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Todas as cidades</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          name="type"
          defaultValue={filters.type ?? ""}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Todos os tipos</option>
          {ADVERTISEMENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="flex h-9 items-center gap-2 rounded-md border px-2 text-sm">
          <input
            type="checkbox"
            name="premium"
            value="1"
            defaultChecked={filters.premium === "1"}
            className="h-4 w-4 accent-whatsapp"
          />
          Só premium ativo
        </label>

        {filters.providerId && (
          <input type="hidden" name="providerId" value={filters.providerId} />
        )}

        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" size="sm" variant="whatsapp">
            Aplicar filtros
          </Button>
          {active && (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/admin/anuncios">
                <X className="h-3.5 w-3.5" />
                Limpar
              </Link>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export function buildAdminAdvertisementsHref(
  filters: AdminAdvertisementFiltersState
): string {
  return buildHref(filters);
}
