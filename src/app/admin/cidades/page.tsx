import Link from "next/link";
import { redirect } from "next/navigation";
import { createCityAction } from "@/actions/admin-catalog-actions";
import { listAdminCities } from "@/application/services/admin-catalog-service";
import { listAllStates } from "@/application/services/catalog-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminCitiesBulkList } from "@/features/admin/components/admin-cities-bulk-list";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminCitiesPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly deleted?: string;
    readonly stateId?: string;
    readonly bulk?: string;
  }>;
}

export default async function AdminCitiesPage({ searchParams }: AdminCitiesPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const [states, cities] = await Promise.all([
    listAllStates(),
    listAdminCities(params.stateId),
  ]);

  function buildFilterUrl(stateId?: string) {
    if (!stateId) return "/admin/cidades";
    return `/admin/cidades?stateId=${stateId}`;
  }

  return (
    <AdminLayout>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Cidades</h2>
        <div className="flex flex-wrap gap-1.5">
          <Button variant={!params.stateId ? "default" : "outline"} size="sm" asChild>
            <Link href={buildFilterUrl()}>Todas</Link>
          </Button>
          {states.map((state) => (
            <Button
              key={state.id}
              variant={params.stateId === state.id ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={buildFilterUrl(state.id)}>{state.uf}</Link>
            </Button>
          ))}
        </div>
      </div>

      {params.error && (
        <p className="mb-3 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-3 rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
          {params.bulk === "activate"
            ? "Cidades ativadas com sucesso."
            : params.bulk === "deactivate"
              ? "Cidades desativadas com sucesso."
              : "Cidade salva com sucesso."}
        </p>
      )}
      {params.deleted === "1" && (
        <p className="mb-3 rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
          Cidade excluída.
        </p>
      )}

      <Card className="mb-4">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-base">Nova cidade</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <form action={createCityAction} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Input name="name" placeholder="Nome da cidade" required />
            <select
              name="stateId"
              defaultValue={params.stateId ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              <option value="">Selecione o estado</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.uf} — {state.name}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <AdminCitiesBulkList
        filterStateId={params.stateId}
        states={states.map((state) => ({
          id: state.id,
          uf: state.uf,
          name: state.name,
        }))}
        cities={cities.map((city) => ({
          id: city.id,
          name: city.name,
          stateId: city.stateId,
          stateUf: city.stateUf,
          isActive: city.isActive,
          usageCount: city.usageCount,
        }))}
      />
    </AdminLayout>
  );
}
