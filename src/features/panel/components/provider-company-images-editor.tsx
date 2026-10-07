"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  removeProviderCompanyImageAction,
  updateProviderCompanyImagesAction,
} from "@/actions/provider-actions";
import { AdvertisementImage } from "@/components/advertisement/advertisement-image";
import {
  ImageFileInput,
  validateFormImageInputs,
} from "@/components/advertisement/image-file-input";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/config/pricing";
import {
  formatMaxImageSizeLabel,
  getFriendlyImageUploadError,
} from "@/shared/utils/image-file-validation";

interface CompanyImage {
  readonly id: string;
  readonly url: string;
}

interface ProviderCompanyImagesEditorProps {
  readonly images: readonly CompanyImage[];
  readonly paidActive: boolean;
}

export function ProviderCompanyImagesEditor({
  images,
  paidActive,
}: ProviderCompanyImagesEditorProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const limit = PRICING.PROVIDER_MAX_COMPANY_PHOTOS;
  const remainingSlots = Math.max(0, limit - images.length);

  if (!paidActive) {
    return (
      <div className="rounded-lg border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
        Assine por {`R$ ${PRICING.SUBSCRIPTION_AMOUNT.toFixed(2).replace(".", ",")}`}
        /mês para enviar até {limit} fotos da empresa. Elas aparecem na página
        do anúncio.{" "}
        <Link
          href="/painel/assinatura"
          className="font-medium text-whatsapp hover:underline"
        >
          Ir para assinatura
        </Link>
        .
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const validationError = validateFormImageInputs(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const formData = new FormData(form);
    setFormError(null);

    startTransition(async () => {
      try {
        await updateProviderCompanyImagesAction(formData);
      } catch (error) {
        if (isRedirectError(error)) throw error;
        setFormError(getFriendlyImageUploadError(error));
      }
    });
  }

  function handleRemove(imageId: string) {
    const formData = new FormData();
    formData.set("imageId", imageId);
    setFormError(null);
    setRemovingImageId(imageId);

    startTransition(async () => {
      try {
        await removeProviderCompanyImageAction(formData);
      } catch (error) {
        if (isRedirectError(error)) throw error;
        setFormError(getFriendlyImageUploadError(error));
        setRemovingImageId(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Até {limit} fotos da empresa (compartilhadas por todos os seus anúncios).
        Com destaque premium no anúncio, somam +{PRICING.PREMIUM_AD_GALLERY} fotos
        específicas (total {PRICING.PREMIUM_MAX_GALLERY}).
      </p>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <AdvertisementImage
                src={image.url}
                alt="Foto da empresa"
                fill
                className="object-cover"
                sizes="200px"
              />
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRemove(image.id)}
                className="absolute right-1 top-1 z-10 rounded-md bg-background/90 p-1.5 text-destructive shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Remover foto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {removingImageId === image.id && isPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 text-xs">
                  Removendo…
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formError && (
        <p
          className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive"
          role="alert"
        >
          {formError}
        </p>
      )}

      {remainingSlots > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-2 rounded-md border bg-background p-2">
            <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
            <ImageFileInput
              id="companyImages"
              name="companyImages"
              label="Fotos da empresa"
              multiple
              hint={`Selecione até ${remainingSlots} foto(s). Máx. ${formatMaxImageSizeLabel()} cada.`}
            />
          </div>
          <Button type="submit" variant="whatsapp" size="sm" disabled={isPending}>
            {isPending && !removingImageId ? "Salvando..." : "Salvar fotos"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Limite de {limit} fotos atingido. Remova uma para adicionar outra.
        </p>
      )}
    </div>
  );
}
