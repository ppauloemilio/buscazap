import { redirect } from "next/navigation";
import {
  createStateAction,
} from "@/actions/admin-catalog-actions";
import { listAdminStates } from "@/application/services/admin-catalog-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminStatesBulkList } from "@/features/admin/components/admin-states-bulk-list";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminStatesPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly deleted?: string;
    readonly bulk?: string;
  }>;
}

export default async function AdminStatesPage({ searchParams }: AdminStatesPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const states = await listAdminStates();

  return (
    <AdminLayout>
      <h2 className="mb-3 text-lg font-semibold">Estados</h2>

      {params.error && (
        <p className="mb-3 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-3 rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
          {params.bulk === "activate"
            ? "Estados ativados com sucesso."
            : params.bulk === "deactivate"
              ? "Estados desativados com sucesso."
              : "Estado salvo com sucesso."}
        </p>
      )}
      {params.deleted === "1" && (
        <p className="mb-3 rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
          Estado excluído.
        </p>
      )}

      <Card className="mb-4">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-base">Novo estado</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <form action={createStateAction} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input name="uf" placeholder="UF" maxLength={2} required />
            <Input name="name" placeholder="Nome do estado" required />
            <Input name="sortOrder" type="number" min={0} defaultValue={0} placeholder="Ordem" />
            <Button type="submit" size="sm">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <AdminStatesBulkList
        states={states.map((state) => ({
          id: state.id,
          uf: state.uf,
          name: state.name,
          sortOrder: state.sortOrder,
          isActive: state.isActive,
          citiesCount: state.citiesCount,
          usageCount: state.usageCount,
        }))}
      />
    </AdminLayout>
  );
}
