"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { adminEditProviderLeadAction } from "@/actions/provider-lead-actions";
import type { CatalogLocationOption } from "@/shared/utils/catalog-location";
import { DescriptionEditor } from "@/components/advertisement/description-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationFields } from "@/features/panel/components/location-fields";
import { ServiceAreaField } from "@/features/panel/components/service-area-field";
import { WhatsAppContactsFields } from "@/features/panel/components/whatsapp-contacts-fields";
import { toLocalWhatsAppDigits } from "@/lib/whatsapp";

interface AdminEditLeadFormProps {
  readonly lead: {
    readonly id: string;
    readonly name: string;
    readonly whatsapp: string;
    readonly whatsappLabel: string | null;
    readonly secondaryWhatsapp: string | null;
    readonly secondaryWhatsappLabel: string | null;
    readonly city: string;
    readonly state: string;
    readonly neighborhood: string | null;
    readonly serviceArea: string;
    readonly adTitle: string;
    readonly description: string | null;
  };
  readonly states: readonly { readonly uf: string; readonly name: string }[];
  readonly cities: readonly CatalogLocationOption[];
}

export function AdminEditLeadForm({
  lead,
  states,
  cities,
}: AdminEditLeadFormProps) {
  const [open, setOpen] = useState(false);
  const fieldId = (name: string) => `${name}-${lead.id}`;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen((value) => !value)}
      >
        <Pencil className="h-3.5 w-3.5" />
        {open ? "Fechar edição" : "Editar dados"}
      </Button>

      {open && (
        <form
          action={adminEditProviderLeadAction}
          className="w-full basis-full space-y-2.5 rounded-lg border border-dashed p-2.5"
        >
          <input type="hidden" name="leadId" value={lead.id} />

          <p className="text-xs font-medium text-foreground">
            Editar lead (antes de publicar)
          </p>

          <div>
            <label htmlFor={fieldId("name")} className="mb-1 block text-xs font-medium">
              Nome
            </label>
            <Input
              id={fieldId("name")}
              name="name"
              defaultValue={lead.name}
              required
              minLength={3}
              className="h-9"
            />
          </div>

          <WhatsAppContactsFields
            primaryName="whatsapp"
            secondaryName="secondaryWhatsapp"
            primaryLabelName="whatsappLabel"
            secondaryLabelName="secondaryWhatsappLabel"
            defaultPrimaryNumber={toLocalWhatsAppDigits(lead.whatsapp)}
            defaultPrimaryLabel={lead.whatsappLabel ?? ""}
            defaultSecondaryNumber={
              lead.secondaryWhatsapp
                ? toLocalWhatsAppDigits(lead.secondaryWhatsapp)
                : ""
            }
            defaultSecondaryLabel={lead.secondaryWhatsappLabel ?? ""}
            showPricingNotes={false}
            compact
          />

          <LocationFields
            compact
            states={states}
            cities={cities}
            defaultCity={lead.city}
            defaultState={lead.state || "PA"}
            cityId={fieldId("city")}
            stateId={fieldId("state")}
          />

          <div>
            <label
              htmlFor={fieldId("neighborhood")}
              className="mb-1 block text-xs font-medium"
            >
              Bairro{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id={fieldId("neighborhood")}
              name="neighborhood"
              defaultValue={lead.neighborhood ?? ""}
              placeholder="Ex.: Nazaré"
              minLength={2}
              className="h-9"
            />
          </div>

          <ServiceAreaField
            id={fieldId("serviceArea")}
            defaultValue={lead.serviceArea}
            labelClassName="mb-1 block text-xs font-medium"
            selectClassName="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            showHint={false}
          />

          <div>
            <label
              htmlFor={fieldId("adTitle")}
              className="mb-1 block text-xs font-medium"
            >
              Nome do anúncio
            </label>
            <Input
              id={fieldId("adTitle")}
              name="adTitle"
              defaultValue={lead.adTitle}
              required
              minLength={5}
              maxLength={80}
              className="h-9"
            />
          </div>

          <div>
            <label
              htmlFor={fieldId("description")}
              className="mb-1 block text-xs font-medium"
            >
              Descrição
            </label>
            <DescriptionEditor
              id={fieldId("description")}
              defaultValue={lead.description ?? ""}
              required
              minLength={20}
              rows={5}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" variant="whatsapp">
              Salvar alterações
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
