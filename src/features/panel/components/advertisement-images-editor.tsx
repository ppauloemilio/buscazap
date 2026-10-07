"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  removeAdvertisementGalleryImageAction,
  removeAdvertisementLogoAction,
  updateAdvertisementImagesAction,
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

interface GalleryImage {
  readonly id: string;
  readonly url: string;
}

type ImageFormAction = (formData: FormData) => void | Promise<void>;

interface AdvertisementImagesEditorProps {
  readonly advertisementId: string;
  readonly title: string;
  readonly coverImage: GalleryImage | null;
  readonly logoImage?: GalleryImage | null;
  readonly galleryImages: readonly GalleryImage[];
  readonly premiumActive: boolean;
  readonly maxGallery?: number;
  readonly backHref?: string;
  readonly updateAction?: ImageFormAction;
  readonly removeGalleryAction?: ImageFormAction;
  readonly removeLogoAction?: ImageFormAction;
  readonly forceGalleryEdit?: boolean;
  readonly showLogoField?: boolean;
}

export function AdvertisementImagesEditor({
  advertisementId,
  title,
  coverImage,
  logoImage = null,
  galleryImages,
  premiumActive,
  maxGallery,
  backHref = "/painel/anuncios",
  updateAction = updateAdvertisementImagesAction,
  removeGalleryAction = removeAdvertisementGalleryImageAction,
  removeLogoAction = removeAdvertisementLogoAction,
  forceGalleryEdit = false,
  showLogoField = false,
}: AdvertisementImagesEditorProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const canEditGallery = premiumActive || forceGalleryEdit;
  const galleryLimit =
    maxGallery ??
    (premiumActive ? PRICING.PREMIUM_MAX_GALLERY : PRICING.PAID_MAX_GALLERY);
  const remainingGallerySlots = Math.max(0, galleryLimit - galleryImages.length);

  function handleUpdateSubmit(event: React.FormEvent<HTMLFormElement>) {
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
        await updateAction(formData);
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }
        setFormError(getFriendlyImageUploadError(error));
      }
    });
  }

  function runRemove(
    formData: FormData,
    imageId: string,
    action: ImageFormAction
  ) {
    setFormError(null);
    setRemovingImageId(imageId);

    startTransition(async () => {
      try {
        await action(formData);
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }
        setFormError(getFriendlyImageUploadError(error));
      } finally {
        setRemovingImageId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3">
        <p className="mb-1 text-sm font-semibold">1. Foto da capa</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Banner principal do perfil e dos cards.
        </p>
        {coverImage && (
          <div className="relative mb-2 aspect-[16/9] max-w-md overflow-hidden rounded-lg border bg-muted">
            <AdvertisementImage
              src={coverImage.url}
              alt={`Capa do anúncio ${title}`}
              fill
              className="object-cover"
              sizes="384px"
            />
          </div>
        )}
      </div>

      {showLogoField && (
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-sm font-semibold">2. Logo da marca</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Aparece ao lado do nome, sem cortar a capa.
          </p>
          {logoImage && (
            <div className="mb-2 flex items-end gap-2">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
                <AdvertisementImage
                  src={logoImage.url}
                  alt={`Logo de ${title}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  runRemove(
                    new FormData(event.currentTarget),
                    logoImage.id,
                    removeLogoAction
                  );
                }}
              >
                <input
                  type="hidden"
                  name="advertisementId"
                  value={advertisementId}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {removingImageId === logoImage.id ? "Removendo..." : "Remover"}
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {canEditGallery && galleryImages.length > 0 && (
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {showLogoField ? "3. " : "2. "}Fotos da galeria
            </p>
            <span className="text-xs text-muted-foreground">
              {galleryImages.length}/{galleryLimit}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {galleryImages.map((image) => (
              <div key={image.id} className="space-y-1.5">
                <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <AdvertisementImage
                    src={image.url}
                    alt={`Foto da galeria de ${title}`}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    runRemove(
                      new FormData(event.currentTarget),
                      image.id,
                      removeGalleryAction
                    );
                  }}
                >
                  <input
                    type="hidden"
                    name="advertisementId"
                    value={advertisementId}
                  />
                  <input type="hidden" name="imageId" value={image.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {removingImageId === image.id ? "Removendo..." : "Remover"}
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <form
        encType="multipart/form-data"
        className="space-y-4"
        onSubmit={handleUpdateSubmit}
      >
        <input type="hidden" name="advertisementId" value={advertisementId} />

        <div className="rounded-lg border border-dashed p-3">
          <label htmlFor="coverImage" className="mb-1 block text-sm font-medium">
            Enviar / substituir capa
          </label>
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
            <ImageFileInput
              id="coverImage"
              name="coverImage"
              label="Foto de capa"
              hint={`JPG, PNG ou WebP. Máx. ${formatMaxImageSizeLabel()}.`}
            />
          </div>
        </div>

        {showLogoField && (
          <div className="rounded-lg border border-dashed p-3">
            <label htmlFor="logoImage" className="mb-1 block text-sm font-medium">
              Enviar / substituir logo
            </label>
            <div className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
              <ImageFileInput
                id="logoImage"
                name="logoImage"
                label="Logo da marca"
                hint={`Preferível quadrada. Máx. ${formatMaxImageSizeLabel()}.`}
              />
            </div>
          </div>
        )}

        {canEditGallery && (
          <div className="rounded-lg border border-dashed p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <label
                htmlFor="galleryImages"
                className="block text-sm font-medium"
              >
                Adicionar fotos à galeria
              </label>
              <span className="text-xs text-muted-foreground">
                {galleryImages.length}/{galleryLimit}
                {premiumActive ? " · premium" : ""}
              </span>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              {premiumActive
                ? `Até ${galleryLimit} fotos com destaque premium.`
                : `Até ${galleryLimit} fotos no plano pago. Premium libera ${PRICING.PREMIUM_MAX_GALLERY}.`}
            </p>
            {remainingGallerySlots > 0 ? (
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                <ImageFileInput
                  id="galleryImages"
                  name="galleryImages"
                  label="Foto da galeria"
                  multiple
                  hint={`Até ${remainingGallerySlots} foto(s). Máx. ${formatMaxImageSizeLabel()} cada.`}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Limite de {galleryLimit} fotos atingido.
              </p>
            )}
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

        <div className="flex gap-2">
          <Button type="submit" variant="whatsapp" size="sm" disabled={isPending}>
            {isPending && !removingImageId ? "Salvando..." : "Salvar fotos"}
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={backHref}>Voltar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
