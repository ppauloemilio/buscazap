"use client";

import { useState } from "react";
import { Pencil, Tag, X } from "lucide-react";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import {
  deleteProviderPromotionAction,
  saveProviderPromotionAction,
  toggleProviderPromotionAction,
} from "@/actions/provider-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isPromotionPubliclyActive } from "@/shared/utils/promotion";
import { ClickableImageThumb } from "@/components/advertisement/clickable-image-thumb";
import { ImageLightbox } from "@/components/advertisement/image-lightbox";

export type PanelPromotion = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly priceOriginal: number;
  readonly pricePromo: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly isEnabled: boolean;
};

function toDatetimeLocalValue(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function promotionStatusLabel(promo: PanelPromotion): string {
  const now = new Date();
  const startsAt = new Date(promo.startsAt);
  const endsAt = new Date(promo.endsAt);
  if (endsAt.getTime() < now.getTime()) {
    return "Expirada";
  }
  if (!promo.isEnabled) {
    return "Desativada";
  }
  if (startsAt.getTime() > now.getTime()) {
    return "Agendada";
  }
  if (
    isPromotionPubliclyActive(
      { isEnabled: promo.isEnabled, startsAt, endsAt },
      now
    )
  ) {
    return "Ativa";
  }
  return "Inativa";
}

interface ProviderPromotionsManagerProps {
  readonly promotions: readonly PanelPromotion[];
}

export function ProviderPromotionsManager({
  promotions,
}: ProviderPromotionsManagerProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const canCreate = promotions.length < PRICING.PLUS_MAX_PROMOTIONS;

  return (
    <div className="space-y-4">
      <ImageLightbox
        url={lightboxUrl}
        alt="Foto da promoção"
        onClose={() => setLightboxUrl(null)}
      />
      <p className="text-sm text-muted-foreground">
        Até {PRICING.PLUS_MAX_PROMOTIONS} promoções por empresa. Clique em{" "}
        <strong>Editar</strong> para alterar título, preços, datas ou foto.
      </p>

      {promotions.map((promo) => {
        const status = promotionStatusLabel(promo);
        const endsAt = new Date(promo.endsAt);
        const canReactivate =
          endsAt.getTime() >= Date.now() && !promo.isEnabled;
        const isEditing = editingId === promo.id;

        return (
          <article
            key={promo.id}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Tag className="h-4 w-4 shrink-0 text-whatsapp" />
                <h3 className="truncate font-semibold">{promo.title}</h3>
              </div>
              <Badge
                variant={
                  status === "Ativa"
                    ? "whatsapp"
                    : status === "Expirada"
                      ? "secondary"
                      : "outline"
                }
              >
                {status}
              </Badge>
            </div>

            {!isEditing ? (
              <>
                {promo.imageUrl ? (
                  <div className="mb-3">
                    <ClickableImageThumb
                      src={promo.imageUrl}
                      alt={promo.title}
                      onOpen={setLightboxUrl}
                    />
                  </div>
                ) : null}
                <p className="mb-2 text-sm text-muted-foreground">
                  {promo.description}
                </p>
                <p className="mb-3 text-sm">
                  De {formatPriceBRL(promo.priceOriginal)} por{" "}
                  <span className="font-semibold text-whatsapp">
                    {formatPriceBRL(promo.pricePromo)}
                  </span>
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  {new Date(promo.startsAt).toLocaleString("pt-BR")} —{" "}
                  {new Date(promo.endsAt).toLocaleString("pt-BR")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="whatsapp"
                    size="sm"
                    onClick={() => setEditingId(promo.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  {canReactivate && (
                    <form action={toggleProviderPromotionAction}>
                      <input type="hidden" name="promotionId" value={promo.id} />
                      <input type="hidden" name="enabled" value="true" />
                      <Button type="submit" variant="outline" size="sm">
                        Reativar
                      </Button>
                    </form>
                  )}
                  {promo.isEnabled && endsAt.getTime() >= Date.now() && (
                    <form action={toggleProviderPromotionAction}>
                      <input type="hidden" name="promotionId" value={promo.id} />
                      <input type="hidden" name="enabled" value="false" />
                      <Button type="submit" variant="outline" size="sm">
                        Desativar
                      </Button>
                    </form>
                  )}
                  <form action={deleteProviderPromotionAction}>
                    <input type="hidden" name="promotionId" value={promo.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Excluir
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <form
                action={saveProviderPromotionAction}
                className="space-y-3"
                encType="multipart/form-data"
              >
                <input type="hidden" name="promotionId" value={promo.id} />
                <div>
                  <label className="mb-1 block text-xs font-medium">Título</label>
                  <Input name="title" defaultValue={promo.title} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    defaultValue={promo.description}
                    required
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Preço original (R$)
                    </label>
                    <Input
                      name="priceOriginal"
                      type="number"
                      step="0.01"
                      min="0.01"
                      defaultValue={promo.priceOriginal}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Preço promocional (R$)
                    </label>
                    <Input
                      name="pricePromo"
                      type="number"
                      step="0.01"
                      min="0.01"
                      defaultValue={promo.pricePromo}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Início
                    </label>
                    <Input
                      name="startsAt"
                      type="datetime-local"
                      defaultValue={toDatetimeLocalValue(promo.startsAt)}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Fim</label>
                    <Input
                      name="endsAt"
                      type="datetime-local"
                      defaultValue={toDatetimeLocalValue(promo.endsAt)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Nova foto (opcional)
                  </label>
                  {promo.imageUrl ? (
                    <div className="mb-2">
                      <ClickableImageThumb
                        src={promo.imageUrl}
                        alt={promo.title}
                        onOpen={setLightboxUrl}
                      />
                    </div>
                  ) : null}
                  <Input name="image" type="file" accept="image/*" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="whatsapp" size="sm">
                    Salvar alterações
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </article>
        );
      })}

      {canCreate && (
        <article className="rounded-xl border border-dashed bg-card p-4">
          <h3 className="mb-3 font-semibold">Nova promoção</h3>
          <form
            action={saveProviderPromotionAction}
            className="space-y-3"
            encType="multipart/form-data"
          >
            <div>
              <label className="mb-1 block text-xs font-medium">Título</label>
              <Input name="title" required placeholder="Ex.: Combo família" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Descrição
              </label>
              <textarea
                name="description"
                required
                rows={3}
                placeholder="Detalhes da oferta"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Preço original (R$)
                </label>
                <Input
                  name="priceOriginal"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Preço promocional (R$)
                </label>
                <Input
                  name="pricePromo"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Início</label>
                <Input name="startsAt" type="datetime-local" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Fim</label>
                <Input name="endsAt" type="datetime-local" required />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Foto</label>
              <Input name="image" type="file" accept="image/*" />
            </div>
            <Button type="submit" variant="whatsapp" size="sm">
              Criar promoção
            </Button>
          </form>
        </article>
      )}
    </div>
  );
}
