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
import { AdvertisementImage } from "@/components/advertisement/advertisement-image";
import {
  ImageFileInput,
  validateFormImageInputs,
} from "@/components/advertisement/image-file-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRICING, formatPriceBRL } from "@/config/pricing";
import { getWeekdayLabels } from "@/shared/utils/business-hours";
import { formatMaxImageSizeLabel } from "@/shared/utils/image-file-validation";

interface ProductItem {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly imageUrl?: string;
}

interface ServiceItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priceFrom?: number;
  readonly imageUrl?: string;
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

  function handleCatalogSubmit(
    event: React.FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<void>
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const validationError = validateFormImageInputs(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    runAction(action, new FormData(form));
    form.reset();
  }

  return (
    <div className="max-w-xl space-y-6 border-t pt-4">
      <div>
        <h3 className="text-base font-semibold">
          Perfil completo — endereço, horários e contatos
        </h3>
        <p className="text-xs text-muted-foreground">
          Descrição fica no formulário acima. Aqui: endereço, horários,
          Instagram, site, produtos e serviços (plano{" "}
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
        <p className="text-xs text-muted-foreground">
          Até {PRICING.PAID_MAX_PRODUCTS} produtos, cada um com foto, nome e preço.
        </p>
        <ul className="space-y-2 text-sm">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
                  {product.imageUrl ? (
                    <AdvertisementImage
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : null}
                </div>
                <span className="truncate">
                  {product.title} — {formatPriceBRL(product.price)}
                </span>
              </div>
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
            encType="multipart/form-data"
            className="space-y-2 rounded-lg border border-dashed p-3"
            onSubmit={(event) =>
              handleCatalogSubmit(event, saveAdvertisementProductAction)
            }
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
            <div className="rounded-md border bg-muted/20 p-2">
              <ImageFileInput
                id="productImage"
                name="image"
                label="Foto do produto"
                hint={`Opcional. JPG, PNG ou WebP. Máx. ${formatMaxImageSizeLabel()}.`}
              />
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              Adicionar produto
            </Button>
          </form>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">
          Serviços ({services.length}/{PRICING.PAID_MAX_SERVICES})
        </h4>
        <p className="text-xs text-muted-foreground">
          Até {PRICING.PAID_MAX_SERVICES} serviços, cada um com foto, nome,
          descrição e preço.
        </p>
        <ul className="space-y-2 text-sm">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
                  {service.imageUrl ? (
                    <AdvertisementImage
                      src={service.imageUrl}
                      alt={service.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : null}
                </div>
                <span className="truncate">
                  {service.title}
                  {typeof service.priceFrom === "number"
                    ? ` — a partir de ${formatPriceBRL(service.priceFrom)}`
                    : ""}
                </span>
              </div>
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
            encType="multipart/form-data"
            className="space-y-2 rounded-lg border border-dashed p-3"
            onSubmit={(event) =>
              handleCatalogSubmit(event, saveAdvertisementServiceAction)
            }
          >
            <input type="hidden" name="advertisementId" value={advertisementId} />
            <Input name="title" placeholder="Nome do serviço" required />
            <Input name="description" placeholder="Descrição curta" required />
            <Input
              name="priceFrom"
              type="number"
              step="0.01"
              min="0"
              placeholder="A partir de R$"
            />
            <div className="rounded-md border bg-muted/20 p-2">
              <ImageFileInput
                id="serviceImage"
                name="image"
                label="Foto do serviço"
                hint={`Opcional. JPG, PNG ou WebP. Máx. ${formatMaxImageSizeLabel()}.`}
              />
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              Adicionar serviço
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
