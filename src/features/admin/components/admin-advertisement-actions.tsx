"use client";

import {
  adminDeleteAdvertisementAction,
  moderateAdvertisementAction,
} from "@/actions/admin-actions";
import { ADMIN_AD_STATUS_OPTIONS } from "@/config/admin";
import { Button } from "@/components/ui/button";

interface AdminAdvertisementActionsProps {
  readonly advertisementId: string;
  readonly currentStatus: string;
  readonly title: string;
  readonly premiumActive: boolean;
}

export function AdminAdvertisementActions({
  advertisementId,
  currentStatus,
  title,
  premiumActive,
}: AdminAdvertisementActionsProps) {
  function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    const message = premiumActive
      ? `Excluir "${title}"? Este anúncio possui destaque premium pago ativo.`
      : `Excluir o anúncio "${title}"?`;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <form action={moderateAdvertisementAction} className="flex items-center gap-2">
        <input type="hidden" name="advertisementId" value={advertisementId} />
        <select
          name="status"
          defaultValue={currentStatus}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {ADMIN_AD_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="outline">
          Salvar status
        </Button>
      </form>

      <form action={adminDeleteAdvertisementAction} onSubmit={handleDelete}>
        <input type="hidden" name="advertisementId" value={advertisementId} />
        <Button type="submit" size="sm" variant="outline" className="text-destructive">
          Excluir
        </Button>
      </form>
    </div>
  );
}
