"use client";

import {
  dismissCategorySuggestionAction,
  mergeCategorySuggestionAction,
  promoteCategorySuggestionAction,
} from "@/actions/admin-catalog-actions";
import { CATEGORY_ICON_OPTIONS } from "@/config/category-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-4 rounded-lg border border-dashed p-4">
      <p className="text-sm font-medium">Ações da sugestão</p>

      <form
        action={promoteCategorySuggestionAction}
        className="grid gap-3 lg:grid-cols-5"
      >
        <input type="hidden" name="suggestionId" value={suggestionId} />
        <Input name="name" defaultValue={name} placeholder="Nome oficial" required />
        <Input name="slug" placeholder="Identificador na URL" />
        <select
          name="icon"
          defaultValue="Tag"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {CATEGORY_ICON_OPTIONS.map((icon) => (
            <option key={icon.value} value={icon.value}>
              {icon.label}
            </option>
          ))}
        </select>
        <Input name="sortOrder" type="number" min={0} defaultValue={0} />
        <Button type="submit" variant="whatsapp" className="lg:col-span-5">
          Promover para categoria oficial
        </Button>
      </form>

      <form action={mergeCategorySuggestionAction} className="flex flex-col gap-2 sm:flex-row">
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
        <Button type="submit" variant="outline">
          Mesclar
        </Button>
      </form>

      <form action={dismissCategorySuggestionAction} onSubmit={handleDismiss}>
        <input type="hidden" name="suggestionId" value={suggestionId} />
        <Button type="submit" variant="outline" className="text-destructive">
          Dispensar sugestão
        </Button>
      </form>
    </div>
  );
}
