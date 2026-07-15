"use client";

import { useState } from "react";
import { adminCreateAdvertisementAction } from "@/actions/admin-actions";
import { ADVERTISEMENT_TYPE_OPTIONS } from "@/config/advertisement-form";
import { PILOT_CITIES } from "@/config/pricing";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/domain/entities";
import { AdvertisementType } from "@/domain/enums";

interface AdminCreateAdvertisementFormProps {
  readonly providerId: string;
  readonly providerName: string;
  readonly defaultWhatsapp: string;
  readonly defaultOpen?: boolean;
  readonly canPublish: boolean;
  readonly categories: readonly Category[];
}

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
        <form action={adminCreateAdvertisementAction} className="space-y-2">
          <input type="hidden" name="providerId" value={providerId} />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium">Título</label>
              <Input name="title" placeholder="Ex.: Gás e água mineral" required minLength={5} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium">Descrição</label>
              <textarea
                name="description"
                required
                minLength={20}
                rows={3}
                placeholder="Descreva o serviço de forma clara para o cliente..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            </div>            <div>
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
          </div>
          <p className="text-[11px] text-muted-foreground">
            O anúncio já entra publicado. O anunciante poderá editar e adicionar fotos depois no painel.
          </p>
          <Button type="submit" size="sm" variant="whatsapp">
            Publicar anúncio
          </Button>
        </form>
      )}
    </div>
  );
}
