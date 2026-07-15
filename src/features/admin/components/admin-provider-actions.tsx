"use client";

import {
  adminDeleteProviderAction,
  adminRegisterSubscriptionAction,
  moderateProviderAction,
} from "@/actions/admin-actions";
import { MANUAL_PAYMENT_METHODS } from "@/config/manual-payment";
import { ADMIN_PROVIDER_STATUS_OPTIONS } from "@/config/admin";
import { PRICING } from "@/config/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  function handleManualSubscription(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const method = new FormData(form).get("method");
    const methodLabel =
      MANUAL_PAYMENT_METHODS.find((item) => item.value === method)?.label ??
      "manual";

    const message = subscriptionActive
      ? `Registrar +${PRICING.SUBSCRIPTION_DAYS} dias de assinatura para "${name}" (${methodLabel})? O prazo será acumulado a partir da data atual de validade.`
      : `Registrar assinatura de ${PRICING.SUBSCRIPTION_DAYS} dias para "${name}" (${methodLabel})? Use para pagamento em dinheiro ou permuta.`;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <div className="space-y-2">
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

      <form
        action={adminRegisterSubscriptionAction}
        onSubmit={handleManualSubscription}
        className="flex flex-col gap-1.5 rounded-lg border border-dashed p-2 sm:flex-row sm:items-center"
      >
        <input type="hidden" name="providerId" value={providerId} />
        <select
          name="method"
          defaultValue="CASH"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Forma de pagamento"
        >
          {MANUAL_PAYMENT_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
        <Input
          name="notes"
          placeholder="Obs. (opcional)"
          className="h-9 sm:max-w-[180px]"
          maxLength={200}
        />
        <Button type="submit" size="sm" variant="whatsapp">
          Registrar assinatura
        </Button>
      </form>
    </div>
  );
}
