import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/actions/admin-catalog-actions";
import { listAdminCategories, listPendingCategorySuggestions } from "@/application/services/admin-catalog-service";
import { getCategoryIconLabel } from "@/config/category-catalog";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminCategorySuggestionActions } from "@/features/admin/components/admin-category-suggestion-actions";
import { AdminDeleteButton } from "@/features/admin/components/admin-delete-button";
import { CategoryIconPicker } from "@/features/admin/components/category-icon-picker";
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
    readonly suggestion?: string;
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
  const [categories, pendingSuggestions] = await Promise.all([
    listAdminCategories(),
    listPendingCategorySuggestions(),
  ]);

  return (
    <AdminLayout>
      <h2 className="mb-2 text-xl font-semibold">Categorias</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Gerencie as categorias exibidas na busca, nos anúncios e no cadastro de anunciantes.
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
      {params.suggestion === "promoted" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Sugestão promovida para categoria oficial. Anúncios vinculados foram atualizados.
        </p>
      )}
      {params.suggestion === "merged" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Sugestão mesclada em categoria existente. Anúncios vinculados foram atualizados.
        </p>
      )}
      {params.suggestion === "dismissed" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Sugestão dispensada. Os anúncios permanecem publicados com a categoria informal.
        </p>
      )}

      {pendingSuggestions.length > 0 && (
        <Card className="mb-6 border-amber-200">
          <CardHeader>
            <CardTitle className="text-base">
              Sugestões de novas categorias ({pendingSuggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Anunciantes informaram estas categorias ao escolher &quot;Outro&quot; ao criar anúncios.
              Promova para o catálogo oficial, mescle em uma existente ou dispense a sugestão.
            </p>
            {pendingSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="rounded-lg border bg-card p-2.5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{suggestion.name}</h3>
                  <Badge variant="outline">{suggestion.advertisementsCount} anúncio(s)</Badge>
                  {suggestion.advertisementsCount >= 3 && (
                    <Badge variant="premium">Alta demanda</Badge>
                  )}
                </div>
                <AdminCategorySuggestionActions
                  suggestionId={suggestion.id}
                  name={suggestion.name}
                  officialCategories={categories.map((category) => ({
                    id: category.id,
                    name: category.name,
                  }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategoryAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="sm:col-span-2 lg:col-span-4">
              <FieldLabel htmlFor="new-category-icon">Ícone (emoji WhatsApp)</FieldLabel>
              <CategoryIconPicker id="new-category-icon" name="icon" />
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="space-y-4 p-4">
              <form action={updateCategoryAction} className="grid gap-3 lg:grid-cols-5">
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
                <div className="lg:col-span-5">
                  <FieldLabel>Ícone (emoji WhatsApp)</FieldLabel>
                  <CategoryIconPicker name="icon" defaultValue={category.icon} />
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
    </AdminLayout>
  );
}
