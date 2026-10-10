import Link from "next/link";
import type { CatalogLocationOption } from "@/shared/utils/catalog-location";
import type { Category } from "@/domain/entities";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { LocationFields } from "@/features/panel/components/location-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FreeAdvertisementFormProps {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly categories: readonly Category[];
  readonly states: readonly { readonly uf: string; readonly name: string }[];
  readonly cities: readonly CatalogLocationOption[];
  readonly defaultTitle?: string;
  readonly defaultCategory?: string;
  readonly defaultCity?: string;
  readonly defaultState?: string;
  readonly defaultNeighborhood?: string;
  readonly defaultWhatsapp?: string;
  readonly advertisementId?: string;
  readonly submitLabel?: string;
  readonly cancelHref?: string;
}

export function FreeAdvertisementForm({
  action,
  categories,
  states,
  cities,
  defaultTitle = "",
  defaultCategory,
  defaultCity = "",
  defaultState = "",
  defaultNeighborhood = "",
  defaultWhatsapp = "",
  advertisementId,
  submitLabel = "Publicar anúncio",
  cancelHref = "/painel/anuncios",
}: FreeAdvertisementFormProps) {
  return (
    <form action={action} className="max-w-md space-y-3">
      {advertisementId ? (
        <input type="hidden" name="advertisementId" value={advertisementId} />
      ) : null}

      <p className="text-sm text-muted-foreground">
        Listagem básica na busca. Capa, descrição e fotos ficam disponíveis no
        plano pago.
      </p>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Título do anúncio
        </label>
        <Input
          id="title"
          name="title"
          defaultValue={defaultTitle}
          placeholder="Ex.: Eletricista — instalações"
          required
          minLength={3}
        />
      </div>

      <AdvertisementCategoryFields
        categories={categories}
        defaultCategory={defaultCategory}
      />

      <LocationFields
        states={states}
        cities={cities}
        defaultCity={defaultCity}
        defaultState={defaultState}
        compact
      />

      <div>
        <label htmlFor="neighborhood" className="mb-1 block text-sm font-medium">
          Bairro
        </label>
        <Input
          id="neighborhood"
          name="neighborhood"
          defaultValue={defaultNeighborhood}
          placeholder="Ex.: Nazaré"
          required
          minLength={2}
        />
      </div>

      <div>
        <label htmlFor="whatsappNumber" className="mb-1 block text-sm font-medium">
          WhatsApp para contato
        </label>
        <Input
          id="whatsappNumber"
          name="whatsappNumber"
          defaultValue={defaultWhatsapp}
          placeholder="91999999999"
          required
          autoComplete="tel"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Número que aparece no anúncio (pode ser o mesmo do login).
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <Button type="submit" variant="whatsapp" size="sm" className="w-full sm:w-auto">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" asChild>
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
