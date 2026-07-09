"use client";

import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import { PRICING } from "@/config/pricing";
import { ImagePlus } from "lucide-react";

const ACCEPT = ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes.join(",");

export function AdvertisementImageFields() {
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
        <input type="checkbox" name="withPremium" className="mt-1" />
        <div>
          <p className="text-sm font-medium">
            Destacar este anúncio (+ R${" "}
            {PRICING.PREMIUM_BOOST_AMOUNT.toFixed(2).replace(".", ",")} / 30 dias)
          </p>
          <p className="text-xs text-muted-foreground">
            Badge premium, seção de destaques, prioridade na busca e até{" "}
            {ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages} fotos extras na galeria — você
            poderá adicioná-las após ativar o destaque premium.
          </p>
        </div>
      </label>
    </div>
  );
}
