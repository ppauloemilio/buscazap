"use client";

import { PRICING } from "@/config/pricing";
import { ImageFileInput } from "@/components/advertisement/image-file-input";
import { formatMaxImageSizeLabel } from "@/shared/utils/image-file-validation";
import { ImagePlus } from "lucide-react";

interface AdvertisementImageFieldsProps {
  readonly showLogo?: boolean;
}

export function AdvertisementImageFields({
  showLogo = false,
}: AdvertisementImageFieldsProps) {
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

      {showLogo ? (
        <div>
          <label htmlFor="logoImage" className="mb-1 block text-sm font-medium">
            Logomarca{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-2.5">
            <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
            <ImageFileInput
              id="logoImage"
              name="logoImage"
              label="Logomarca"
              hint={`JPG, PNG ou WebP. Máximo ${formatMaxImageSizeLabel()}. Aparece no card e no cabeçalho do anúncio.`}
            />
          </div>
        </div>
      ) : null}

      <label className="flex items-start gap-2 rounded-lg border p-2.5">
        <input type="checkbox" name="withPremium" className="mt-0.5" />
        <div>
          <p className="text-sm font-medium">
            Destacar este anúncio (+ R${" "}
            {PRICING.PREMIUM_BOOST_AMOUNT.toFixed(2).replace(".", ",")} / 30 dias)
          </p>
          <p className="text-xs text-muted-foreground">
            Badge premium, seção de destaques, prioridade na busca e +
            {PRICING.PREMIUM_AD_GALLERY} fotos neste anúncio (somam às{" "}
            {PRICING.PROVIDER_MAX_COMPANY_PHOTOS} da empresa em Meu perfil =
            total {PRICING.PREMIUM_MAX_GALLERY}) — adicione após ativar o
            destaque.
          </p>
        </div>
      </label>
    </div>
  );
}
