import Link from "next/link";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuickFreeNotifyStatusFilter = "pending" | "notified";

export interface AdminQuickFreeNotifyFiltersState {
  readonly days: number;
  readonly category?: string;
  readonly status?: QuickFreeNotifyStatusFilter;
}

interface AdminQuickFreeNotifyFiltersProps {
  readonly filters: AdminQuickFreeNotifyFiltersState;
  readonly categories: readonly string[];
  readonly resultCount: number;
  readonly pendingCount: number;
}

export function buildQuickFreeAvisosHref(
  filters: AdminQuickFreeNotifyFiltersState
): string {
  const params = new URLSearchParams();
  params.set("days", String(filters.days));
  if (filters.category?.trim()) {
    params.set("category", filters.category.trim());
  }
  if (filters.status === "pending" || filters.status === "notified") {
    params.set("status", filters.status);
  }
  return `/admin/cadastro-rapido/avisos?${params.toString()}`;
}

function hasActiveFilters(filters: AdminQuickFreeNotifyFiltersState): boolean {
  return Boolean(
    filters.category?.trim() ||
      filters.status === "pending" ||
      filters.status === "notified"
  );
}

export function AdminQuickFreeNotifyFilters({
  filters,
  categories,
  resultCount,
  pendingCount,
}: AdminQuickFreeNotifyFiltersProps) {
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
          {" · "}
          {pendingCount} pendente{pendingCount === 1 ? "" : "s"}
        </p>
      </div>

      <form
        action="/admin/cadastro-rapido/avisos"
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input type="hidden" name="days" value={filters.days} />

        <select
          name="category"
          defaultValue={filters.category ?? ""}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="notified">Avisado</option>
        </select>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" size="sm" variant="whatsapp">
            Aplicar filtros
          </Button>
          {active && (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href={buildQuickFreeAvisosHref({ days: filters.days })}>
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
