"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  removeAdvertisementGalleryImageAction,
  updateAdvertisementImagesAction,
} from "@/actions/provider-actions";
import { AdvertisementImage } from "@/components/advertisement/advertisement-image";
import {
  ImageFileInput,
  validateFormImageInputs,
} from "@/components/advertisement/image-file-input";
import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import { Button } from "@/components/ui/button";
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
  readonly galleryImages: readonly GalleryImage[];
  readonly premiumActive: boolean;
  readonly backHref?: string;
  readonly updateAction?: ImageFormAction;
  readonly removeGalleryAction?: ImageFormAction;
  /** When true, gallery editing is available even if premium is inactive (admin). */
  readonly forceGalleryEdit?: boolean;
}

export function AdvertisementImagesEditor({
  advertisementId,
  title,
  coverImage,
  galleryImages,
  premiumActive,
  backHref = "/painel/anuncios",
  updateAction = updateAdvertisementImagesAction,
  removeGalleryAction = removeAdvertisementGalleryImageAction,
  forceGalleryEdit = false,
}: AdvertisementImagesEditorProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const canEditGallery = premiumActive || forceGalleryEdit;
  const remainingGallerySlots = Math.max(
    0,
    ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages - galleryImages.length
  );

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

  function handleRemoveSubmit(
    event: React.FormEvent<HTMLFormElement>,
    imageId: string
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFormError(null);
    setRemovingImageId(imageId);

    startTransition(async () => {
      try {
        await removeGalleryAction(formData);
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
    <div className="space-y-3">
      {canEditGallery && galleryImages.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Fotos atuais da galeria</p>
            <span className="text-xs text-muted-foreground">
              {galleryImages.length}/{ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages} fotos
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
                    className="object-contain"
                    sizes="200px"
                  />
                </div>
                <form onSubmit={(event) => handleRemoveSubmit(event, image.id)}>
                  <input type="hidden" name="advertisementId" value={advertisementId} />
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
        className="space-y-3"
        onSubmit={handleUpdateSubmit}
      >
        <input type="hidden" name="advertisementId" value={advertisementId} />

        <div>
          <label htmlFor="coverImage" className="mb-1 block text-sm font-medium">
            Foto de capa
          </label>
          {coverImage && (
            <div className="relative mb-2 aspect-square max-w-sm overflow-hidden rounded-lg border bg-muted sm:aspect-[4/3]">
              <AdvertisementImage
                src={coverImage.url}
                alt={`Capa do anúncio ${title}`}
                fill
                className="object-contain"
                sizes="384px"
              />
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-2.5">
            <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
            <ImageFileInput
              id="coverImage"
              name="coverImage"
              label="Foto de capa"
              hint={
                coverImage
                  ? `Envie uma nova imagem para substituir a capa atual. JPG, PNG ou WebP. Máximo ${formatMaxImageSizeLabel()}.`
                  : `Adicione a foto de capa do anúncio. JPG, PNG ou WebP. Máximo ${formatMaxImageSizeLabel()}.`
              }
            />
          </div>
        </div>

        {canEditGallery && (
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label htmlFor="galleryImages" className="block text-sm font-medium">
                Adicionar fotos à galeria premium
              </label>
              {galleryImages.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  0/{ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages} fotos
                </span>
              )}
            </div>

            {!premiumActive && forceGalleryEdit && (
              <p className="mb-2 text-xs text-muted-foreground">
                Premium inativo: a galeria só aparece publicamente com destaque ativo.
              </p>
            )}

            {remainingGallerySlots > 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-2.5">
                <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                <ImageFileInput
                  id="galleryImages"
                  name="galleryImages"
                  label="Foto da galeria"
                  multiple
                  hint={`Adicione até ${remainingGallerySlots} foto${remainingGallerySlots === 1 ? "" : "s"} extra${remainingGallerySlots === 1 ? "" : "s"} (máx. ${formatMaxImageSizeLabel()} cada). Se o envio falhar, tente uma foto por vez.`}
                />
              </div>
            ) : (
              <p className="rounded-lg border bg-muted/40 p-2.5 text-sm text-muted-foreground">
                Você atingiu o limite de {ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages}{" "}
                fotos na galeria premium. Remova uma foto para adicionar outra.
              </p>
            )}
          </div>
        )}

        {formError && (
          <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive" role="alert">
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
