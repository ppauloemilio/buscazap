"use client";

import { AdvertisementProductsEditor } from "@/features/panel/components/advertisement-products-editor";
import { AdvertisementProfileExtrasEditor } from "@/features/panel/components/advertisement-profile-extras-editor";
import { AdvertisementServicesEditor } from "@/features/panel/components/advertisement-services-editor";

interface ProductItem {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly imageUrl?: string;
}

interface ServiceItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priceFrom?: number;
  readonly imageUrl?: string;
}

/** @deprecated Prefer editors em Meu perfil / Produtos / Serviços */
interface AdvertisementPaidProfileEditorProps {
  readonly advertisementId: string;
  readonly streetAddress?: string | null;
  readonly instagram?: string | null;
  readonly website?: string | null;
  readonly businessHoursJson?: string | null;
  readonly products: readonly ProductItem[];
  readonly services: readonly ServiceItem[];
  readonly maxProducts: number;
  readonly maxServices: number;
}

export function AdvertisementPaidProfileEditor({
  advertisementId,
  streetAddress,
  instagram,
  website,
  businessHoursJson,
  products,
  services,
  maxProducts,
  maxServices,
}: AdvertisementPaidProfileEditorProps) {
  return (
    <div className="max-w-xl space-y-6 border-t pt-4">
      <AdvertisementProfileExtrasEditor
        advertisementId={advertisementId}
        streetAddress={streetAddress}
        instagram={instagram}
        website={website}
        businessHoursJson={businessHoursJson}
        returnTo={`/painel/anuncios/${advertisementId}/editar`}
      />
      <AdvertisementProductsEditor
        advertisementId={advertisementId}
        products={products}
        maxProducts={maxProducts}
        returnTo={`/painel/anuncios/${advertisementId}/editar`}
      />
      <AdvertisementServicesEditor
        advertisementId={advertisementId}
        services={services}
        maxServices={maxServices}
        returnTo={`/painel/anuncios/${advertisementId}/editar`}
      />
    </div>
  );
}
