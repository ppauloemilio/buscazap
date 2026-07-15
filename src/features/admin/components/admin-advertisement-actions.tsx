"use client";

import {
  adminDeleteAdvertisementAction,
  adminRegisterPremiumBoostAction,
  moderateAdvertisementAction,
} from "@/actions/admin-actions";
import { MANUAL_PAYMENT_METHODS } from "@/config/manual-payment";
import { ADMIN_AD_STATUS_OPTIONS } from "@/config/admin";
import { PRICING } from "@/config/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  function handleManualPremium(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const method = new FormData(form).get("method");
    const methodLabel =
      MANUAL_PAYMENT_METHODS.find((item) => item.value === method)?.label ??
      "manual";

    const message = premiumActive
      ? `Registrar +${PRICING.PREMIUM_BOOST_DAYS} dias de destaque para "${title}" (${methodLabel})? O prazo será acumulado.`
      : `Registrar destaque premium de ${PRICING.PREMIUM_BOOST_DAYS} dias para "${title}" (${methodLabel})? Use para pagamento em dinheiro ou permuta.`;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <div className="space-y-2">
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

      <form
        action={adminRegisterPremiumBoostAction}
        onSubmit={handleManualPremium}
        className="flex flex-col gap-1.5 rounded-lg border border-dashed p-2 sm:flex-row sm:items-center"
      >
        <input type="hidden" name="advertisementId" value={advertisementId} />
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
          Registrar premium
        </Button>
      </form>
    </div>
  );
}
