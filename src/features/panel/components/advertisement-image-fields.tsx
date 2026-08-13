"use client";

import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import { PRICING } from "@/config/pricing";
import { ImageFileInput } from "@/components/advertisement/image-file-input";
import { formatMaxImageSizeLabel } from "@/shared/utils/image-file-validation";
import { ImagePlus } from "lucide-react";

export function AdvertisementImageFields() {
  return (
    <div className="space-y-2.5">
      <div>
        <label htmlFor="coverImage" className="mb-1 block text-sm font-medium">
          Foto de capa
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-2.5">
          <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
          <ImageFileInput
            id="coverImage"
            name="coverImage"
            label="Foto de capa"
            required
            hint={`JPG, PNG ou WebP. Máximo ${formatMaxImageSizeLabel()}. Aparece na listagem e na página do anúncio.`}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 rounded-lg border p-2.5">
        <input type="checkbox" name="withPremium" className="mt-0.5" />
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
