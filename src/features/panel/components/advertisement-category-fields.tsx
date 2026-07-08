"use client";

import { useState } from "react";
import type { Category } from "@/domain/entities";
import { CATEGORY_OTHER_VALUE } from "@/config/advertisement-form";
import { Input } from "@/components/ui/input";

interface AdvertisementCategoryFieldsProps {
  readonly categories: readonly Category[];
}

export function AdvertisementCategoryFields({
  categories,
}: AdvertisementCategoryFieldsProps) {
  const [category, setCategory] = useState(categories[0]?.name ?? "");
  const isOther = category === CATEGORY_OTHER_VALUE;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="category" className="mb-1.5 block text-sm font-medium">
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
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
          <option value={CATEGORY_OTHER_VALUE}>Outro</option>
        </select>
      </div>

      {isOther && (
        <div>
          <label
            htmlFor="customCategory"
            className="mb-1.5 block text-sm font-medium"
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
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Se for parecida com uma categoria existente, usaremos a oficial automaticamente.
            Caso contrário, seu anúncio será publicado e a sugestão irá para análise do administrador.
          </p>
        </div>
      )}
    </div>
  );
}
