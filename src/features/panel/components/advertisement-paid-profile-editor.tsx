"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  deleteAdvertisementProductAction,
  deleteAdvertisementServiceAction,
  saveAdvertisementProductAction,
  saveAdvertisementServiceAction,
  updateAdvertisementProfileExtrasAction,
} from "@/actions/provider-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRICING, formatPriceBRL } from "@/config/pricing";
import { getWeekdayLabels } from "@/shared/utils/business-hours";

interface ProductItem {
  readonly id: string;
  readonly title: string;
  readonly price: number;
}

interface ServiceItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priceFrom?: number;
}

interface AdvertisementPaidProfileEditorProps {
  readonly advertisementId: string;
  readonly streetAddress?: string | null;
  readonly instagram?: string | null;
  readonly website?: string | null;
  readonly businessHoursJson?: string | null;
  readonly products: readonly ProductItem[];
  readonly services: readonly ServiceItem[];
}

function parseHoursDefaults(raw: string | null | undefined): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (let i = 0; i < 7; i += 1) defaults[String(i)] = "";
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw) as Record<string, string | null>;
    for (let i = 0; i < 7; i += 1) {
      defaults[String(i)] = parsed[String(i)] ?? "";
    }
  } catch {
    // ignore
  }
  return defaults;
}

export function AdvertisementPaidProfileEditor({
  advertisementId,
  streetAddress,
  instagram,
  website,
  businessHoursJson,
  products,
  services,
}: AdvertisementPaidProfileEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hourDefaults = parseHoursDefaults(businessHoursJson);
  const dayLabels = getWeekdayLabels();

  function runAction(action: (formData: FormData) => Promise<void>, formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (err) {
        if (isRedirectError(err)) throw err;
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  }

  return (
    <div className="max-w-xl space-y-6 border-t pt-4">
      <div>
        <h3 className="text-base font-semibold">Perfil completo</h3>
        <p className="text-xs text-muted-foreground">
          Endereço, horários, Instagram, site, produtos e serviços (plano{" "}
          {formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}).
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form
        className="space-y-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          runAction(
            updateAdvertisementProfileExtrasAction,
            new FormData(event.currentTarget)
          );
        }}
      >
        <input type="hidden" name="advertisementId" value={advertisementId} />
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="streetAddress">
            Endereço completo
          </label>
          <Input
            id="streetAddress"
            name="streetAddress"
            defaultValue={streetAddress ?? ""}
            placeholder="Rua, número"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="instagram">
              Instagram
            </label>
            <Input
              id="instagram"
              name="instagram"
              defaultValue={instagram ?? ""}
              placeholder="@suaempresa"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="website">
              Site
            </label>
            <Input
              id="website"
              name="website"
              defaultValue={website ?? ""}
              placeholder="suaempresa.com.br"
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium">Horário de funcionamento</p>
          <div className="space-y-1.5">
            {dayLabels.map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-xs text-muted-foreground">
                  {label}
                </span>
                <Input
                  name={`hours_${index}`}
                  defaultValue={hourDefaults[String(index)] ?? ""}
                  placeholder="08:00-18:00 ou vazio"
                  className="h-8"
                />
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" size="sm" variant="whatsapp" disabled={isPending}>
          Salvar perfil
        </Button>
      </form>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">
          Produtos ({products.length}/{PRICING.PAID_MAX_PRODUCTS})
        </h4>
        <ul className="space-y-1 text-sm">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
            >
              <span>
                {product.title} — {formatPriceBRL(product.price)}
              </span>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  runAction(
                    deleteAdvertisementProductAction,
                    new FormData(event.currentTarget)
                  );
                }}
              >
                <input type="hidden" name="advertisementId" value={advertisementId} />
                <input type="hidden" name="productId" value={product.id} />
                <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                  Remover
                </Button>
              </form>
            </li>
          ))}
        </ul>
        {products.length < PRICING.PAID_MAX_PRODUCTS && (
          <form
            className="grid gap-2 rounded-lg border border-dashed p-2 sm:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                saveAdvertisementProductAction,
                new FormData(event.currentTarget)
              );
              event.currentTarget.reset();
            }}
          >
            <input type="hidden" name="advertisementId" value={advertisementId} />
            <Input name="title" placeholder="Nome do produto" required />
            <Input
              name="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Preço"
              required
            />
            <Button type="submit" size="sm" disabled={isPending}>
              Adicionar
            </Button>
          </form>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">
          Serviços ({services.length}/{PRICING.PAID_MAX_SERVICES})
        </h4>
        <ul className="space-y-1 text-sm">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
            >
              <span>
                {service.title}
                {typeof service.priceFrom === "number"
                  ? ` — a partir de ${formatPriceBRL(service.priceFrom)}`
                  : ""}
              </span>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  runAction(
                    deleteAdvertisementServiceAction,
                    new FormData(event.currentTarget)
                  );
                }}
              >
                <input type="hidden" name="advertisementId" value={advertisementId} />
                <input type="hidden" name="serviceId" value={service.id} />
                <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                  Remover
                </Button>
              </form>
            </li>
          ))}
        </ul>
        {services.length < PRICING.PAID_MAX_SERVICES && (
          <form
            className="space-y-2 rounded-lg border border-dashed p-2"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                saveAdvertisementServiceAction,
                new FormData(event.currentTarget)
              );
              event.currentTarget.reset();
            }}
          >
            <input type="hidden" name="advertisementId" value={advertisementId} />
            <Input name="title" placeholder="Nome do serviço" required />
            <Input name="description" placeholder="Descrição curta" required />
            <div className="flex gap-2">
              <Input
                name="priceFrom"
                type="number"
                step="0.01"
                min="0"
                placeholder="A partir de R$"
              />
              <Button type="submit" size="sm" disabled={isPending}>
                Adicionar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
