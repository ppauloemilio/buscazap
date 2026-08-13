"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
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
import { formatMaxImageSizeLabel } from "@/shared/utils/image-file-validation";

interface GalleryImage {
  readonly id: string;
  readonly url: string;
}

interface AdvertisementImagesEditorProps {
  readonly advertisementId: string;
  readonly title: string;
  readonly coverImage: GalleryImage | null;
  readonly galleryImages: readonly GalleryImage[];
  readonly premiumActive: boolean;
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="whatsapp" size="sm" disabled={pending}>
      {pending ? "Salvando..." : "Salvar fotos"}
    </Button>
  );
}

function RemoveGalleryButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "Removendo..." : "Remover"}
    </Button>
  );
}

export function AdvertisementImagesEditor({
  advertisementId,
  title,
  coverImage,
  galleryImages,
  premiumActive,
}: AdvertisementImagesEditorProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const remainingGallerySlots = Math.max(
    0,
    ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages - galleryImages.length
  );

  return (
    <div className="space-y-3">
      {premiumActive && galleryImages.length > 0 && (
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
                <form action={removeAdvertisementGalleryImageAction}>
                  <input type="hidden" name="advertisementId" value={advertisementId} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <RemoveGalleryButton />
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <form
        action={updateAdvertisementImagesAction}
        encType="multipart/form-data"
        className="space-y-3"
        onSubmit={(event) => {
          const error = validateFormImageInputs(event.currentTarget);
          if (error) {
            event.preventDefault();
            setFormError(error);
            return;
          }
          setFormError(null);
        }}
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

        {premiumActive && (
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

            {remainingGallerySlots > 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-2.5">
                <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                <ImageFileInput
                  id="galleryImages"
                  name="galleryImages"
                  label="Foto da galeria"
                  multiple
                  hint={`Adicione até ${remainingGallerySlots} foto${remainingGallerySlots === 1 ? "" : "s"} extra${remainingGallerySlots === 1 ? "" : "s"} (máx. ${formatMaxImageSizeLabel()} cada).`}
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
          <SaveButton />
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/painel/anuncios">Voltar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
