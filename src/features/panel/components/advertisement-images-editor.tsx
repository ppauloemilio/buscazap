"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  removeAdvertisementGalleryImageAction,
  updateAdvertisementImagesAction,
} from "@/actions/provider-actions";
import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import { Button } from "@/components/ui/button";

const ACCEPT = ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes.join(",");

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
                <div className="relative aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={image.url}
                    alt={`Foto da galeria de ${title}`}
                    fill
                    className="object-cover"
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
      >
        <input type="hidden" name="advertisementId" value={advertisementId} />

        <div>
          <label htmlFor="coverImage" className="mb-1 block text-sm font-medium">
            Foto de capa
          </label>
          {coverImage && (
            <div className="relative mb-2 aspect-[4/3] max-w-sm overflow-hidden rounded-lg border">
              <Image
                src={coverImage.url}
                alt={`Capa do anúncio ${title}`}
                fill
                className="object-cover"
                sizes="384px"
              />
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-2.5">
            <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <input
                id="coverImage"
                name="coverImage"
                type="file"
                accept={ACCEPT}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
              <p className="mt-0.5 text-xs text-muted-foreground">
                {coverImage
                  ? "Envie uma nova imagem para substituir a capa atual."
                  : "Adicione a foto de capa do anúncio."}{" "}
                JPG, PNG ou WebP. Máximo 5 MB.
              </p>
            </div>
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
                <div className="min-w-0 flex-1">
                  <input
                    id="galleryImages"
                    name="galleryImages"
                    type="file"
                    accept={ACCEPT}
                    multiple
                    className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
                  />
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Adicione até {remainingGallerySlots} foto
                    {remainingGallerySlots === 1 ? "" : "s"} extra
                    {remainingGallerySlots === 1 ? "" : "s"} para demonstrar seu produto ou
                    serviço.
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-lg border bg-muted/40 p-2.5 text-sm text-muted-foreground">
                Você atingiu o limite de {ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages}{" "}
                fotos na galeria premium. Remova uma foto para adicionar outra.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <SaveButton />
          <Button type="button" variant="outline" size="sm" asChild>
            <a href="/painel/anuncios">Voltar</a>
          </Button>
        </div>
      </form>
    </div>
  );
}
