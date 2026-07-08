import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/actions/admin-catalog-actions";
import { listAdminCategories, getAdminCustomCategories } from "@/application/services/admin-catalog-service";
import {
  CATEGORY_ICON_OPTIONS,
  getCategoryIconLabel,
} from "@/config/category-catalog";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminDeleteButton } from "@/features/admin/components/admin-delete-button";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminCategoriesPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly deleted?: string;
  }>;
}

function FieldLabel({
  htmlFor,
  children,
}: {
  readonly htmlFor?: string;
  readonly children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
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
      <h2 className="mb-2 text-xl font-semibold">Categorias</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Gerencie as categorias exibidas na busca, nos anúncios e no cadastro de prestadores.
      </p>

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
            <div>
              <FieldLabel htmlFor="new-category-name">Nome</FieldLabel>
              <Input id="new-category-name" name="name" placeholder="Ex.: Pet shop" required />
            </div>
            <div>
              <FieldLabel htmlFor="new-category-slug">Identificador na URL (opcional)</FieldLabel>
              <Input
                id="new-category-slug"
                name="slug"
                placeholder="Ex.: pet-shop"
              />
            </div>
            <div>
              <FieldLabel htmlFor="new-category-icon">Ícone</FieldLabel>
              <select
                id="new-category-icon"
                name="icon"
                defaultValue="Tag"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORY_ICON_OPTIONS.map((icon) => (
                  <option key={icon.value} value={icon.value}>
                    {icon.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="new-category-order">Ordem de exibição</FieldLabel>
              <Input
                id="new-category-order"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={0}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Adicionar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="space-y-4 p-4">
              <form action={updateCategoryAction} className="grid gap-3 lg:grid-cols-6">
                <input type="hidden" name="id" value={category.id} />
                <div>
                  <FieldLabel>Nome</FieldLabel>
                  <Input name="name" defaultValue={category.name} required />
                </div>
                <div>
                  <FieldLabel>Identificador na URL</FieldLabel>
                  <Input name="slug" defaultValue={category.slug} />
                </div>
                <div>
                  <FieldLabel>Ícone</FieldLabel>
                  <select
                    name="icon"
                    defaultValue={category.icon}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {CATEGORY_ICON_OPTIONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Ordem</FieldLabel>
                  <Input
                    name="sortOrder"
                    type="number"
                    min={0}
                    defaultValue={category.sortOrder}
                  />
                </div>
                <div>
                  <FieldLabel>Situação</FieldLabel>
                  <select
                    name="isActive"
                    defaultValue={category.isActive ? "true" : "false"}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="true">Ativa</option>
                    <option value="false">Inativa</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="outline" className="w-full">
                    Salvar
                  </Button>
                </div>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={category.isActive ? "whatsapp" : "secondary"}>
                    {category.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                  <span>Ícone: {getCategoryIconLabel(category.icon)}</span>
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
            <CardTitle className="text-base">Categorias informadas manualmente nos anúncios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="mb-3 text-sm text-muted-foreground">
              Estas categorias foram digitadas por prestadores na opção &quot;Outro&quot; e ainda não
              fazem parte do catálogo oficial.
            </p>
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
