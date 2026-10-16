import Link from "next/link";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AdminProviderFiltersState = {
  readonly status?: string;
  readonly subscription?: string;
  readonly ads?: string;
  readonly created?: string;
  readonly category?: string;
  readonly plan?: string;
};

interface AdminProviderFiltersProps {
  readonly filters: AdminProviderFiltersState;
  readonly categories: readonly { readonly name: string }[];
  readonly resultCount: number;
}

function buildHref(filters: AdminProviderFiltersState): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.subscription) params.set("subscription", filters.subscription);
  if (filters.ads) params.set("ads", filters.ads);
  if (filters.created) params.set("created", filters.created);
  if (filters.category) params.set("category", filters.category);
  if (filters.plan) params.set("plan", filters.plan);
  const qs = params.toString();
  return qs ? `/admin/usuarios?${qs}` : "/admin/usuarios";
}

export function AdminProviderFilters({
  filters,
  categories,
  resultCount,
}: AdminProviderFiltersProps) {
  const hasExtraFilters = Boolean(filters.category || filters.plan);

  return (
    <div className="mb-4 space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4 text-whatsapp" />
          Filtros por categoria e plano
        </div>
        <p className="text-xs text-muted-foreground">
          {resultCount} usuário{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      <form
        action="/admin/usuarios"
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        {filters.status ? (
          <input type="hidden" name="status" value={filters.status} />
        ) : null}
        {filters.subscription ? (
          <input
            type="hidden"
            name="subscription"
            value={filters.subscription}
          />
        ) : null}
        {filters.ads ? (
          <input type="hidden" name="ads" value={filters.ads} />
        ) : null}
        {filters.created ? (
          <input type="hidden" name="created" value={filters.created} />
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-medium">Categoria</label>
          <select
            name="category"
            defaultValue={filters.category ?? ""}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Tipo de plano</label>
          <select
            name="plan"
            defaultValue={filters.plan ?? ""}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="free">Plano Grátis</option>
            <option value="basic">Plano Básico</option>
            <option value="pro">Plano Pro</option>
          </select>
        </div>

        <div className="flex items-end gap-2 sm:col-span-2">
          <Button type="submit" size="sm" variant="whatsapp">
            Aplicar filtros
          </Button>
          {hasExtraFilters ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link
                href={buildHref({
                  status: filters.status,
                  subscription: filters.subscription,
                  ads: filters.ads,
                  created: filters.created,
                })}
              >
                <X className="h-3.5 w-3.5" />
                Limpar categoria/plano
              </Link>
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
