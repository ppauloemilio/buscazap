"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import { PRICING } from "@/config/pricing";

const ACCEPT = ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes.join(",");

export function AdvertisementImageFields() {
  const [withPremium, setWithPremium] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="coverImage" className="mb-1.5 block text-sm font-medium">
          Foto de capa
        </label>
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
          <ImagePlus className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <input
              id="coverImage"
              name="coverImage"
              type="file"
              accept={ACCEPT}
              required
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG ou WebP. Máximo 5 MB. Aparece na listagem e na página do anúncio.
            </p>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border p-4">
        <input
          type="checkbox"
          name="withPremium"
          className="mt-1"
          checked={withPremium}
          onChange={(event) => setWithPremium(event.target.checked)}
        />
        <div>
          <p className="text-sm font-medium">
            Destacar este anúncio (+ R${" "}
            {PRICING.PREMIUM_BOOST_AMOUNT.toFixed(2).replace(".", ",")} / 30 dias)
          </p>
          <p className="text-xs text-muted-foreground">
            Badge premium, seção de destaques, prioridade na busca e até{" "}
            {ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages} fotos extras para demonstrar seu
            produto ou serviço.
          </p>
        </div>
      </label>

      {withPremium && (
        <div>
          <label htmlFor="galleryImages" className="mb-1.5 block text-sm font-medium">
            Fotos extras (opcional, até {ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages})
          </label>
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
            <ImagePlus className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <input
                id="galleryImages"
                name="galleryImages"
                type="file"
                accept={ACCEPT}
                multiple
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Selecione até {ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages} imagens para a
                galeria do anúncio premium.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
