"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPriceBRL, PRICING } from "@/config/pricing";

interface WhatsAppContactsFieldsProps {
  readonly primaryName?: string;
  readonly secondaryName?: string;
  readonly primaryLabelName?: string;
  readonly secondaryLabelName?: string;
  readonly defaultPrimaryNumber?: string;
  readonly defaultPrimaryLabel?: string;
  readonly defaultSecondaryNumber?: string;
  readonly defaultSecondaryLabel?: string;
  readonly primaryRequired?: boolean;
  readonly showPricingNotes?: boolean;
  readonly compact?: boolean;
}

export function WhatsAppContactsFields({
  primaryName = "whatsappNumber",
  secondaryName = "secondaryWhatsappNumber",
  primaryLabelName = "whatsappLabel",
  secondaryLabelName = "secondaryWhatsappLabel",
  defaultPrimaryNumber = "",
  defaultPrimaryLabel = "",
  defaultSecondaryNumber = "",
  defaultSecondaryLabel = "",
  primaryRequired = true,
  showPricingNotes = true,
  compact = false,
}: WhatsAppContactsFieldsProps) {
  const [showSecondary, setShowSecondary] = useState(
    Boolean(defaultSecondaryNumber)
  );

  const labelClass = compact
    ? "mb-1 block text-xs font-medium"
    : "mb-1 block text-sm font-medium";
  const hintClass = compact
    ? "mt-1 text-[11px] text-muted-foreground"
    : "mt-1 text-xs text-muted-foreground";

  return (
    <div className="space-y-2.5">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <label htmlFor={primaryName} className={labelClass}>
              WhatsApp principal
            </label>
            <Input
              id={primaryName}
              name={primaryName}
              defaultValue={defaultPrimaryNumber}
              placeholder="91999999999"
              required={primaryRequired}
            />
          </div>
          <div>
            <label htmlFor={primaryLabelName} className={labelClass}>
              Título do contato{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id={primaryLabelName}
              name={primaryLabelName}
              defaultValue={defaultPrimaryLabel}
              placeholder="Ex.: Principal, Pedidos"
              maxLength={40}
            />
          </div>
        </div>

        {!showSecondary && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mb-0.5 shrink-0"
            onClick={() => setShowSecondary(true)}
            aria-label="Adicionar segundo WhatsApp"
            title="Adicionar segundo WhatsApp"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showSecondary && (
        <div className="rounded-lg border border-dashed border-whatsapp/30 bg-whatsapp/5 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
              2º WhatsApp
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSecondary(false)}
              aria-label="Remover segundo WhatsApp"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div>
              <label htmlFor={secondaryLabelName} className={labelClass}>
                Título
              </label>
              <Input
                id={secondaryLabelName}
                name={secondaryLabelName}
                defaultValue={defaultSecondaryLabel}
                placeholder="Ex.: Delivery, Unidade 2"
                maxLength={40}
                required
              />
            </div>
            <div>
              <label htmlFor={secondaryName} className={labelClass}>
                Número
              </label>
              <Input
                id={secondaryName}
                name={secondaryName}
                defaultValue={defaultSecondaryNumber}
                placeholder="91999999999"
                required
              />
            </div>
          </div>
          {showPricingNotes && (
            <p className={hintClass}>
              2º contato no mesmo anúncio: +
              {formatPriceBRL(PRICING.EXTRA_WHATSAPP_AMOUNT)}/mês na mensalidade.
            </p>
          )}
        </div>
      )}

      {showPricingNotes && (
        <p className={hintClass}>
          Até {PRICING.MAX_WHATSAPP_PER_AD} WhatsApps no mesmo anúncio. Filial em outro
          endereço? Crie outro anúncio (+
          {formatPriceBRL(PRICING.EXTRA_AD_AMOUNT)}/mês cada). A mensalidade básica (
          {formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}) inclui{" "}
          {PRICING.ADS_INCLUDED_PER_SUBSCRIPTION} anúncio.
        </p>
      )}
    </div>
  );
}
