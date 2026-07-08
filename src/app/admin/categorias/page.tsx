import { redirect } from "next/navigation";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/actions/admin-catalog-actions";
import { listAdminCategories, getAdminCustomCategories } from "@/application/services/admin-catalog-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminDeleteButton } from "@/features/admin/components/admin-delete-button";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ICON_OPTIONS = [
  "Heart",
  "Sparkles",
  "Hammer",
  "UtensilsCrossed",
  "Laptop",
  "GraduationCap",
  "Car",
  "Shirt",
  "Tag",
] as const;

interface AdminCategoriesPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly deleted?: string;
  }>;
}

export default async function AdminCategoriesPage({
  searchParams,
}: AdminCategoriesPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const [categories, customCategories] = await Promise.all([
    listAdminCategories(),
    getAdminCustomCategories(),
  ]);

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold">Categorias</h2>

      {params.error && (
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Categoria salva com sucesso.
        </p>
      )}
      {params.deleted === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Categoria excluída.
        </p>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategoryAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input name="name" placeholder="Nome" required />
            <Input name="slug" placeholder="Slug (opcional)" />
            <select
              name="icon"
              defaultValue="Tag"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
            <Input name="sortOrder" type="number" min={0} defaultValue={0} placeholder="Ordem" />
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="space-y-4 p-4">
              <form action={updateCategoryAction} className="grid gap-3 lg:grid-cols-6">
                <input type="hidden" name="id" value={category.id} />
                <Input name="name" defaultValue={category.name} required />
                <Input name="slug" defaultValue={category.slug} />
                <select
                  name="icon"
                  defaultValue={category.icon}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                <Input
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={category.sortOrder}
                />
                <select
                  name="isActive"
                  defaultValue={category.isActive ? "true" : "false"}
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
                  <Badge variant={category.isActive ? "whatsapp" : "secondary"}>
                    {category.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                  <span>{category.advertisementsCount} anúncio(s)</span>
                </div>
                <AdminDeleteButton
                  action={deleteCategoryAction}
                  id={category.id}
                  label="Excluir"
                  confirmMessage={`Excluir a categoria "${category.name}"?`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customCategories.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Categorias personalizadas em anúncios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {customCategories.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <p className="font-medium">{item.name}</p>
                <Badge variant="outline">{item.advertisementsCount} anúncio(s)</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
