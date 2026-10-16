"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  removeAdvertisementLogoAction,
  updateAdvertisementImagesAction,
} from "@/actions/provider-actions";
import { AdvertisementImage } from "@/components/advertisement/advertisement-image";
import {
  ImageFileInput,
  validateFormImageInputs,
} from "@/components/advertisement/image-file-input";
import { Button } from "@/components/ui/button";
import {
  formatMaxImageSizeLabel,
  getFriendlyImageUploadError,
} from "@/shared/utils/image-file-validation";

interface AdvertisementLogoEditorProps {
  readonly advertisementId: string;
  readonly title: string;
  readonly logoImage: { readonly id: string; readonly url: string } | null;
  readonly returnTo?: string;
}

export function AdvertisementLogoEditor({
  advertisementId,
  title,
  logoImage,
  returnTo = "/painel/perfil",
}: AdvertisementLogoEditorProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const validationError = validateFormImageInputs(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    startTransition(async () => {
      try {
        await updateAdvertisementImagesAction(new FormData(form));
      } catch (error) {
        if (isRedirectError(error)) throw error;
        setFormError(getFriendlyImageUploadError(error));
      }
    });
  }

  function handleRemove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    startTransition(async () => {
      try {
        await removeAdvertisementLogoAction(new FormData(event.currentTarget));
      } catch (error) {
        if (isRedirectError(error)) throw error;
        setFormError(getFriendlyImageUploadError(error));
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Aparece ao lado do nome no anúncio &quot;{title}&quot;, sem cortar a
        capa.
      </p>

      {logoImage ? (
        <div className="flex items-end gap-2">
          <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
            <AdvertisementImage
              src={logoImage.url}
              alt={`Logo de ${title}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <form onSubmit={handleRemove}>
            <input type="hidden" name="advertisementId" value={advertisementId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isPending}
              className="text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover
            </Button>
          </form>
        </div>
      ) : null}

      <form
        encType="multipart/form-data"
        className="space-y-3 rounded-lg border border-dashed p-3"
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="advertisementId" value={advertisementId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="flex items-center gap-2">
          <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
          <ImageFileInput
            id="logoImage"
            name="logoImage"
            label="Logo da marca"
            hint={`Preferível quadrada. Máx. ${formatMaxImageSizeLabel()}.`}
          />
        </div>
        {formError ? (
          <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
            {formError}
          </p>
        ) : null}
        <Button type="submit" variant="whatsapp" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar logo"}
        </Button>
      </form>
    </div>
  );
}
