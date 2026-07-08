import { redirect } from "next/navigation";
import {
  createStateAction,
  deleteStateAction,
  updateStateAction,
} from "@/actions/admin-catalog-actions";
import { listAdminStates } from "@/application/services/admin-catalog-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminDeleteButton } from "@/features/admin/components/admin-delete-button";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminStatesPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly deleted?: string;
  }>;
}

export default async function AdminStatesPage({ searchParams }: AdminStatesPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const states = await listAdminStates();

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold">Estados</h2>

      {params.error && (
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Estado salvo com sucesso.
        </p>
      )}
      {params.deleted === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Estado excluído.
        </p>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Novo estado</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createStateAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input name="uf" placeholder="UF" maxLength={2} required />
            <Input name="name" placeholder="Nome do estado" required />
            <Input name="sortOrder" type="number" min={0} defaultValue={0} placeholder="Ordem" />
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {states.map((state) => (
          <Card key={state.id}>
            <CardContent className="space-y-4 p-4">
              <form action={updateStateAction} className="grid gap-3 lg:grid-cols-5">
                <input type="hidden" name="id" value={state.id} />
                <Input name="uf" defaultValue={state.uf} maxLength={2} required />
                <Input name="name" defaultValue={state.name} required />
                <Input
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={state.sortOrder}
                />
                <select
                  name="isActive"
                  defaultValue={state.isActive ? "true" : "false"}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
                <Button type="submit" variant="outline">
                  Salvar
                </Button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={state.isActive ? "whatsapp" : "secondary"}>
                    {state.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <span>{state.citiesCount} cidade(s)</span>
                  <span>{state.usageCount} uso(s) em anúncios/usuários</span>
                </div>
                <AdminDeleteButton
                  action={deleteStateAction}
                  id={state.id}
                  label="Excluir"
                  confirmMessage={`Excluir o estado ${state.uf} — ${state.name}?`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
