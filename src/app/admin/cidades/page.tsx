import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createCityAction,
  deleteCityAction,
  updateCityAction,
} from "@/actions/admin-catalog-actions";
import { listAdminCities } from "@/application/services/admin-catalog-service";
import { listAllStates } from "@/application/services/catalog-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminDeleteButton } from "@/features/admin/components/admin-delete-button";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminCitiesPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly deleted?: string;
    readonly stateId?: string;
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Cidades</h2>
        <div className="flex flex-wrap gap-2">
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
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Cidade salva com sucesso.
        </p>
      )}
      {params.deleted === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Cidade excluída.
        </p>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nova cidade</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCityAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {cities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma cidade encontrada.
            </CardContent>
          </Card>
        ) : (
          cities.map((city) => (
            <Card key={city.id}>
              <CardContent className="space-y-4 p-4">
                <form action={updateCityAction} className="grid gap-3 lg:grid-cols-4">
                  <input type="hidden" name="id" value={city.id} />
                  <Input name="name" defaultValue={city.name} required />
                  <select
                    name="stateId"
                    defaultValue={city.stateId}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.uf} — {state.name}
                      </option>
                    ))}
                  </select>
                  <select
                    name="isActive"
                    defaultValue={city.isActive ? "true" : "false"}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="true">Ativa</option>
                    <option value="false">Inativa</option>
                  </select>
                  <Button type="submit" variant="outline">
                    Salvar
                  </Button>
                </form>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={city.isActive ? "whatsapp" : "secondary"}>
                      {city.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                    <span>
                      {city.name}/{city.stateUf}
                    </span>
                    <span>{city.usageCount} anúncio(s)</span>
                  </div>
                  <AdminDeleteButton
                    action={deleteCityAction}
                    id={city.id}
                    label="Excluir"
                    confirmMessage={`Excluir a cidade ${city.name}/${city.stateUf}?`}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
