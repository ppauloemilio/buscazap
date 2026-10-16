"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  deleteAdvertisementProductAction,
  saveAdvertisementProductAction,
} from "@/actions/provider-actions";
import {
  ImageFileInput,
  validateFormImageInputs,
} from "@/components/advertisement/image-file-input";
import {
  ClickableImageThumb,
  IMAGE_THUMB_CLASS,
} from "@/components/advertisement/clickable-image-thumb";
import { ImageLightbox } from "@/components/advertisement/image-lightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPriceBRL } from "@/config/pricing";
import { formatMaxImageSizeLabel } from "@/shared/utils/image-file-validation";
import { cn } from "@/lib/utils";

interface ProductItem {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly imageUrl?: string;
}

interface AdvertisementProductsEditorProps {
  readonly advertisementId: string;
  readonly products: readonly ProductItem[];
  readonly maxProducts: number;
  readonly returnTo?: string;
}

export function AdvertisementProductsEditor({
  advertisementId,
  products,
  maxProducts,
  returnTo = "/painel/produtos",
}: AdvertisementProductsEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    <div className="space-y-3">
      <ImageLightbox
        url={lightboxUrl}
        alt="Foto ampliada"
        onClose={() => setLightboxUrl(null)}
      />
      <p className="text-xs text-muted-foreground">
        Até {maxProducts} produtos, cada um com foto, nome e preço.
      </p>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ul className="space-y-2 text-sm">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
          >
            <div className="flex min-w-0 items-center gap-2">
              {product.imageUrl ? (
                <ClickableImageThumb
                  src={product.imageUrl}
                  alt={product.title}
                  onOpen={setLightboxUrl}
                  className="shrink-0"
                />
              ) : (
                <div className={cn(IMAGE_THUMB_CLASS, "shrink-0")} aria-hidden />
              )}
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
              <input type="hidden" name="returnTo" value={returnTo} />
              <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                Remover
              </Button>
            </form>
          </li>
        ))}
      </ul>

      {products.length < maxProducts ? (
        <form
          encType="multipart/form-data"
          className="space-y-2 rounded-lg border border-dashed p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const validationError = validateFormImageInputs(form);
            if (validationError) {
              setError(validationError);
              return;
            }
            runAction(saveAdvertisementProductAction, new FormData(form));
            form.reset();
          }}
        >
          <input type="hidden" name="advertisementId" value={advertisementId} />
          <input type="hidden" name="returnTo" value={returnTo} />
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
          <Button type="submit" size="sm" variant="whatsapp" disabled={isPending}>
            Adicionar produto
          </Button>
        </form>
      ) : null}
    </div>
  );
}
