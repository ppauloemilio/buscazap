"use client";

import {
  adminDeleteProviderAction,
  moderateProviderAction,
} from "@/actions/admin-actions";
import { ADMIN_PROVIDER_STATUS_OPTIONS } from "@/config/admin";
import { Button } from "@/components/ui/button";

interface AdminProviderActionsProps {
  readonly providerId: string;
  readonly currentStatus: string;
  readonly name: string;
  readonly advertisementsCount: number;
  readonly subscriptionActive: boolean;
}

export function AdminProviderActions({
  providerId,
  currentStatus,
  name,
  advertisementsCount,
  subscriptionActive,
}: AdminProviderActionsProps) {
  function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    const details: string[] = [];

    if (advertisementsCount > 0) {
      details.push(`${advertisementsCount} anúncio(s) serão excluídos`);
    }

    if (subscriptionActive) {
      details.push("a assinatura ativa será removida");
    }

    const suffix =
      details.length > 0 ? ` ${details.join(" e ")} permanentemente.` : ".";

    const message = `Excluir o usuário "${name}"? Todos os dados${suffix}`;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <form action={moderateProviderAction} className="flex items-center gap-2">
        <input type="hidden" name="providerId" value={providerId} />
        <select
          name="status"
          defaultValue={currentStatus}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {ADMIN_PROVIDER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="outline">
          Salvar status
        </Button>
      </form>

      <form action={adminDeleteProviderAction} onSubmit={handleDelete}>
        <input type="hidden" name="providerId" value={providerId} />
        <Button type="submit" size="sm" variant="outline" className="text-destructive">
          Excluir
        </Button>
      </form>
    </div>
  );
}
