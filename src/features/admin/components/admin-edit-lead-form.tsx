"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { adminEditProviderLeadAction } from "@/actions/provider-lead-actions";
import { DescriptionEditor } from "@/components/advertisement/description-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PILOT_CITIES } from "@/config/pricing";
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
}

export function AdminEditLeadForm({ lead }: AdminEditLeadFormProps) {
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
          <input type="hidden" name="state" value={lead.state || "PA"} />

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

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label
                htmlFor={fieldId("city")}
                className="mb-1 block text-xs font-medium"
              >
                Cidade
              </label>
              <select
                id={fieldId("city")}
                name="city"
                required
                defaultValue={lead.city}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {PILOT_CITIES.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
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
