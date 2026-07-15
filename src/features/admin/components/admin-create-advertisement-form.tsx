"use client";

import { useState } from "react";
import { adminCreateAdvertisementAction } from "@/actions/admin-actions";
import { ADVERTISEMENT_TYPE_OPTIONS } from "@/config/advertisement-form";
import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import { PILOT_CITIES } from "@/config/pricing";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { DescriptionEditor } from "@/components/advertisement/description-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/domain/entities";
import { AdvertisementType } from "@/domain/enums";
import { ImagePlus } from "lucide-react";

interface AdminCreateAdvertisementFormProps {
  readonly providerId: string;
  readonly providerName: string;
  readonly defaultWhatsapp: string;
  readonly defaultOpen?: boolean;
  readonly canPublish: boolean;
  readonly categories: readonly Category[];
}

const ACCEPT = ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes.join(",");

export function AdminCreateAdvertisementForm({
  providerId,
  providerName,
  defaultWhatsapp,
  defaultOpen = false,
  canPublish,
  categories,
}: AdminCreateAdvertisementFormProps) {
  const [open, setOpen] = useState(defaultOpen);
  const defaultCity = PILOT_CITIES[0];

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
            <div>
              <label className="mb-1 block text-xs font-medium">Cidade</label>
              <Input
                name="city"
                list={`admin-ad-cities-${providerId}`}
                defaultValue={defaultCity?.name ?? "Belém"}
                required
              />
              <datalist id={`admin-ad-cities-${providerId}`}>
                {PILOT_CITIES.map((city) => (
                  <option key={city.name} value={city.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">UF</label>
              <Input
                name="state"
                defaultValue={defaultCity?.state ?? "PA"}
                maxLength={2}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Bairro (opcional)</label>
              <Input name="neighborhood" placeholder="Ex.: Centro" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">WhatsApp do anúncio</label>
              <Input name="whatsappNumber" defaultValue={defaultWhatsapp} required />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium">Foto de capa (opcional)</label>
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-2">
                <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <input
                    name="coverImage"
                    type="file"
                    accept={ACCEPT}
                    className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
                  />
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    JPG, PNG ou WebP · máx. 5 MB. Você também pode adicionar/trocar depois na edição.
                  </p>
                </div>
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
