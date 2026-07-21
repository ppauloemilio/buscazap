"use client";

import { adminPublishProviderLeadAction } from "@/actions/provider-lead-actions";
import { ADVERTISEMENT_TYPE_OPTIONS } from "@/config/advertisement-form";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { Button } from "@/components/ui/button";
import type { Category } from "@/domain/entities";
import { AdvertisementType } from "@/domain/enums";

interface AdminPublishLeadFormProps {
  readonly leadId: string;
  readonly categories: readonly Category[];
}

export function AdminPublishLeadForm({
  leadId,
  categories,
}: AdminPublishLeadFormProps) {
  return (
    <form
      action={adminPublishProviderLeadAction}
      className="w-full space-y-2 rounded-lg border border-whatsapp/30 bg-whatsapp/5 p-2.5"
    >
      <input type="hidden" name="leadId" value={leadId} />
      <p className="text-xs font-medium text-foreground">
        Antes de publicar, defina tipo e categoria
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor={`type-${leadId}`} className="mb-1 block text-xs font-medium">
            Tipo
          </label>
          <select
            id={`type-${leadId}`}
            name="type"
            required
            defaultValue={AdvertisementType.SERVICE}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            {ADVERTISEMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1 [&_label]:text-xs [&_select]:h-9 [&_select]:px-2">
          <AdvertisementCategoryFields categories={categories} />
        </div>
      </div>
      <Button type="submit" size="sm" variant="whatsapp">
        Publicar anúncio
      </Button>
    </form>
  );
}
