"use client";

import {
  dismissCategorySuggestionAction,
  mergeCategorySuggestionAction,
  promoteCategorySuggestionAction,
} from "@/actions/admin-catalog-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIconPicker } from "@/features/admin/components/category-icon-picker";

interface AdminCategorySuggestionActionsProps {
  readonly suggestionId: string;
  readonly name: string;
  readonly officialCategories: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
}

export function AdminCategorySuggestionActions({
  suggestionId,
  name,
  officialCategories,
}: AdminCategorySuggestionActionsProps) {
  function handleDismiss(event: React.FormEvent<HTMLFormElement>) {
    if (
      !window.confirm(
        `Dispensar a sugestão "${name}"? Os anúncios continuarão publicados com essa categoria informal.`
      )
    ) {
      event.preventDefault();
    }
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-dashed p-2.5">
      <p className="text-sm font-medium">Ações rápidas</p>

      <form action={promoteCategorySuggestionAction} className="space-y-2">
        <input type="hidden" name="suggestionId" value={suggestionId} />
        <div className="grid gap-2 sm:grid-cols-3">
          <Input name="name" defaultValue={name} placeholder="Nome oficial" required />
          <Input name="slug" placeholder="Identificador na URL" />
          <Input name="sortOrder" type="number" min={0} defaultValue={0} />
        </div>
        <CategoryIconPicker name="icon" />
        <Button type="submit" variant="whatsapp" size="sm">
          Promover
        </Button>
      </form>

      <form action={mergeCategorySuggestionAction} className="flex flex-col gap-1.5 sm:flex-row">
        <input type="hidden" name="suggestionId" value={suggestionId} />
        <select
          name="targetCategoryId"
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Mesclar em categoria existente
          </option>
          {officialCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Mesclar
        </Button>
      </form>

      <form action={dismissCategorySuggestionAction} onSubmit={handleDismiss}>
        <input type="hidden" name="suggestionId" value={suggestionId} />
        <Button type="submit" variant="outline" size="sm" className="text-destructive">
          Dispensar
        </Button>
      </form>
    </div>
  );
}
