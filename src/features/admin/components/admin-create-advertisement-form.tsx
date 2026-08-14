"use client";

import { useState } from "react";
import { adminCreateAdvertisementAction } from "@/actions/admin-actions";
import { ADVERTISEMENT_TYPE_OPTIONS } from "@/config/advertisement-form";
import type { CatalogLocationOption } from "@/shared/utils/catalog-location";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { LocationFields } from "@/features/panel/components/location-fields";
import { ServiceAreaField } from "@/features/panel/components/service-area-field";
import { WhatsAppContactsFields } from "@/features/panel/components/whatsapp-contacts-fields";
import { DescriptionEditor } from "@/components/advertisement/description-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/domain/entities";
import { AdvertisementType, ServiceArea } from "@/domain/enums";
import { ImageFileInput } from "@/components/advertisement/image-file-input";
import { ImagePlus } from "lucide-react";
import { toLocalWhatsAppDigits } from "@/lib/whatsapp";
import { formatMaxImageSizeLabel } from "@/shared/utils/image-file-validation";

interface AdminCreateAdvertisementFormProps {
  readonly providerId: string;
  readonly providerName: string;
  readonly defaultWhatsapp: string;
  readonly defaultOpen?: boolean;
  readonly canPublish: boolean;
  readonly categories: readonly Category[];
  readonly states: readonly { readonly uf: string; readonly name: string }[];
  readonly cities: readonly CatalogLocationOption[];
}

export function AdminCreateAdvertisementForm({
  providerId,
  providerName,
  defaultWhatsapp,
  defaultOpen = false,
  canPublish,
  categories,
  states,
  cities,
}: AdminCreateAdvertisementFormProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!canPublish) {
    return (
      <p className="rounded-lg border border-dashed p-2 text-xs text-muted-foreground">
        Ative o trial/assinatura de {providerName} para criar o primeiro anúncio.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-dashed p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Criar anúncio para {providerName}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Fechar" : "Abrir formulário"}
        </Button>
      </div>

      {open && (
        <form
          action={adminCreateAdvertisementAction}
          encType="multipart/form-data"
          className="space-y-2"
        >
          <input type="hidden" name="providerId" value={providerId} />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium">Título</label>
              <Input name="title" placeholder="Ex.: Gás e água mineral" required minLength={5} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium">Descrição</label>
              <DescriptionEditor
                required
                minLength={20}
                rows={8}
                placeholder={"Ex.:\nFILÉ DE GÓ FRITA — R$ 22,00\nFRANGO FRITO — R$ 20,00"}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Tipo</label>
              <select
                name="type"
                defaultValue={AdvertisementType.SERVICE}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                {ADVERTISEMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <AdvertisementCategoryFields categories={categories} />
            </div>
            <div className="sm:col-span-2">
              <LocationFields
                compact
                states={states}
                cities={cities}
                cityId={`city-${providerId}`}
                stateId={`state-${providerId}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Bairro{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Input
                name="neighborhood"
                placeholder="Ex.: Nazaré — ou vazio se for delivery"
                minLength={2}
              />
            </div>
            <div>
              <ServiceAreaField
                id={`serviceArea-${providerId}`}
                defaultValue={ServiceArea.CITY_WIDE}
                labelClassName="mb-1 block text-xs font-medium"
                selectClassName="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                showHint={false}
              />
            </div>
            <div className="sm:col-span-2">
              <WhatsAppContactsFields
                compact
                showPricingNotes={false}
                defaultPrimaryNumber={toLocalWhatsAppDigits(defaultWhatsapp)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium">Foto de capa (opcional)</label>
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-2">
                <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                <ImageFileInput
                  name="coverImage"
                  label="Foto de capa"
                  hint={`JPG, PNG ou WebP · máx. ${formatMaxImageSizeLabel()}. Você também pode adicionar/trocar depois na edição.`}
                />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            O anúncio já entra publicado. Após salvar, você poderá editar os dados e a foto.
          </p>
          <Button type="submit" size="sm" variant="whatsapp">
            Publicar anúncio
          </Button>
        </form>
      )}
    </div>
  );
}
