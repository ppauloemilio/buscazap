"use client";

import { useState } from "react";
import type { Category } from "@/domain/entities";
import { CATEGORY_OTHER_VALUE } from "@/config/advertisement-form";
import { Input } from "@/components/ui/input";

interface AdvertisementCategoryFieldsProps {
  readonly categories: readonly Category[];
  readonly defaultCategory?: string;
}

export function AdvertisementCategoryFields({
  categories,
  defaultCategory,
}: AdvertisementCategoryFieldsProps) {
  const knownCategory = Boolean(
    defaultCategory && categories.some((item) => item.name === defaultCategory)
  );
  const initialCategory = knownCategory
    ? (defaultCategory as string)
    : defaultCategory
      ? CATEGORY_OTHER_VALUE
      : categories[0]?.name ?? "";
  const customDefault = knownCategory ? undefined : defaultCategory;

  const [category, setCategory] = useState(initialCategory);
  const isOther = category === CATEGORY_OTHER_VALUE;

  return (
    <div className="space-y-2.5">
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">
          Categoria
        </label>
        <select
          id="category"
          name="category"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
          <option value={CATEGORY_OTHER_VALUE}>Outro</option>
        </select>
      </div>

      {isOther && (
        <div>
          <label
            htmlFor="customCategory"
            className="mb-1 block text-sm font-medium"
          >
            Qual categoria?
          </label>
          <Input
            id="customCategory"
            name="customCategory"
            placeholder="Ex.: Pet shop, Eventos, Consultoria..."
            required
            minLength={2}
            maxLength={50}
            defaultValue={customDefault}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Se for parecida com uma categoria existente, usaremos a oficial automaticamente.
            Caso contrário, seu anúncio será publicado e a sugestão irá para análise do administrador.
          </p>
        </div>
      )}
    </div>
  );
}
