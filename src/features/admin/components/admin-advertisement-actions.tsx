"use client";

import {
  adminCreatePremiumPixWhatsAppAction,
  adminCreateSubscriptionPixWhatsAppAction,
  adminDeleteAdvertisementAction,
  adminRegisterPremiumBoostAction,
  adminRegisterSubscriptionAction,
  moderateAdvertisementAction,
} from "@/actions/admin-actions";
import type { AdminProviderPlanFilter } from "@/application/services/admin-service";
import { AdminPixWhatsAppButton } from "@/features/admin/components/admin-pix-whatsapp-button";
import { MANUAL_PAYMENT_METHODS } from "@/config/manual-payment";
import { ADMIN_AD_STATUS_OPTIONS } from "@/config/admin";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import { calculateProRataUpgradeAmount } from "@/lib/subscription-proration-calc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminAdvertisementActionsProps {
  readonly advertisementId: string;
  readonly providerId: string;
  readonly providerName: string;
  readonly currentStatus: string;
  readonly title: string;
  readonly premiumActive: boolean;
  readonly subscriptionActive: boolean;
  readonly providerPlan: AdminProviderPlanFilter;
  readonly subscriptionExpiresAt: Date | string | null;
  readonly returnTo?: string;
}

export function AdminAdvertisementActions({
  advertisementId,
  providerId,
  providerName,
  currentStatus,
  title,
  premiumActive,
  subscriptionActive,
  providerPlan,
  subscriptionExpiresAt,
  returnTo = "/admin/anuncios",
}: AdminAdvertisementActionsProps) {
  const expiresAt =
    subscriptionExpiresAt instanceof Date
      ? subscriptionExpiresAt
      : subscriptionExpiresAt
        ? new Date(subscriptionExpiresAt)
        : null;

  const canMigrateToPro = subscriptionActive && providerPlan === "basic";
  const proRataAmount =
    canMigrateToPro && expiresAt
      ? calculateProRataUpgradeAmount(expiresAt)
      : null;
  const isActivePro = subscriptionActive && providerPlan === "pro";

  function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    const message = premiumActive
      ? `Excluir "${title}"? Este anúncio possui destaque premium pago ativo.`
      : `Excluir o anúncio "${title}"?`;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  function handleManualSubscription(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const data = new FormData(form);
    const method = data.get("method");
    const mode = data.get("mode");
    const methodLabel =
      MANUAL_PAYMENT_METHODS.find((item) => item.value === method)?.label ??
      "manual";

    let message: string;
    if (mode === "plus_upgrade") {
      const amountLabel = proRataAmount
        ? formatPriceBRL(proRataAmount)
        : "pro-rata";
      const validUntil = expiresAt?.toLocaleDateString("pt-BR") ?? "a data atual";
      message = `Migrar "${providerName}" para Plano Pro (${methodLabel}, ${amountLabel})? A validade permanece até ${validUntil} (mesmo cálculo do painel do anunciante).`;
    } else if (mode === "plus") {
      message = isActivePro
        ? `Registrar +${PRICING.SUBSCRIPTION_DAYS} dias de Plano Pro para "${providerName}" (${methodLabel}, ${formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)})?`
        : `Assinar Plano Pro de ${PRICING.SUBSCRIPTION_DAYS} dias para "${providerName}" (${methodLabel}, ${formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)})?`;
    } else {
      message = subscriptionActive
        ? `Registrar +${PRICING.SUBSCRIPTION_DAYS} dias de assinatura básica para "${providerName}" (${methodLabel})? O prazo será acumulado a partir da data atual de validade.`
        : `Registrar assinatura básica de ${PRICING.SUBSCRIPTION_DAYS} dias para "${providerName}" (${methodLabel})? Use para pagamento em dinheiro ou permuta.`;
    }

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
        action={adminRegisterSubscriptionAction}
        onSubmit={handleManualSubscription}
        className="flex flex-col gap-1.5 rounded-lg border border-dashed p-2 sm:flex-row sm:items-center"
      >
        <input type="hidden" name="providerId" value={providerId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="mode" value="basic" />
        <select
          name="method"
          defaultValue="CASH"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Forma de pagamento da assinatura básica"
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

      <AdminPixWhatsAppButton
        action={adminCreateSubscriptionPixWhatsAppAction}
        hiddenFields={{ providerId, mode: "basic" }}
        label={`Pix assinatura ${formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)} + WhatsApp`}
        confirmMessage={`Gerar Pix da assinatura básica (${formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}) para "${providerName}" e abrir o WhatsApp com o copia e cola?`}
      />

      <form
        action={adminRegisterSubscriptionAction}
        onSubmit={handleManualSubscription}
        className="flex flex-col gap-1.5 rounded-lg border border-dashed border-whatsapp/40 p-2 sm:flex-row sm:items-center"
      >
        <input type="hidden" name="providerId" value={providerId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="mode" value="plus" />
        <select
          name="method"
          defaultValue="CASH"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Forma de pagamento do Plano Pro"
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
          {isActivePro ? "Renovar Plano Pro" : "Assinar Plano Pro"}
        </Button>
      </form>

      <AdminPixWhatsAppButton
        action={adminCreateSubscriptionPixWhatsAppAction}
        hiddenFields={{ providerId, mode: "plus" }}
        label={`Pix Pro ${formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)} + WhatsApp`}
        confirmMessage={`Gerar Pix do Plano Pro (${formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)}) para "${providerName}" e abrir o WhatsApp com o copia e cola?`}
      />

      {canMigrateToPro && proRataAmount !== null ? (
        <>
          <form
            action={adminRegisterSubscriptionAction}
            onSubmit={handleManualSubscription}
            className="flex flex-col gap-1.5 rounded-lg border border-dashed border-amber-300/70 p-2 sm:flex-row sm:items-center"
          >
            <input type="hidden" name="providerId" value={providerId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="mode" value="plus_upgrade" />
            <select
              name="method"
              defaultValue="CASH"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              aria-label="Forma de pagamento da migração Pro"
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
              Migrar para Pro ({formatPriceBRL(proRataAmount)})
            </Button>
          </form>

          <AdminPixWhatsAppButton
            action={adminCreateSubscriptionPixWhatsAppAction}
            hiddenFields={{ providerId, mode: "plus_upgrade" }}
            label={`Pix upgrade Pro ${formatPriceBRL(proRataAmount)} + WhatsApp`}
            confirmMessage={`Gerar Pix do upgrade proporcional para Pro (${formatPriceBRL(proRataAmount)}) para "${providerName}" e abrir o WhatsApp? A validade atual será mantida.`}
          />
        </>
      ) : null}

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

      <AdminPixWhatsAppButton
        action={adminCreatePremiumPixWhatsAppAction}
        hiddenFields={{ advertisementId }}
        label={`Pix premium ${formatPriceBRL(PRICING.PREMIUM_BOOST_AMOUNT)} + WhatsApp`}
        confirmMessage={`Gerar Pix do destaque premium (${formatPriceBRL(PRICING.PREMIUM_BOOST_AMOUNT)}) para "${title}" e abrir o WhatsApp com o copia e cola?`}
      />
    </div>
  );
}
