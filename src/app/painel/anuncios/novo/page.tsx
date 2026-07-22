import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdvertisementAction } from "@/actions/provider-actions";
import { ADVERTISEMENT_TYPE_OPTIONS } from "@/config/advertisement-form";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { AdvertisementImageFields } from "@/features/panel/components/advertisement-image-fields";
import { ServiceAreaField } from "@/features/panel/components/service-area-field";
import { WhatsAppContactsFields } from "@/features/panel/components/whatsapp-contacts-fields";
import { DescriptionEditor } from "@/components/advertisement/description-editor";
import { getCurrentProvider, canProviderPublish, isAdminProvider } from "@/lib/provider-session";
import { toLocalWhatsAppDigits } from "@/lib/whatsapp";
import {
  getCategoriesWithCounts,
  listActiveStates,
} from "@/application/services/catalog-service";
import {
  providerHasAdSlotAvailable,
} from "@/application/services/advertisement-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPriceBRL, PILOT_CITIES, PRICING } from "@/config/pricing";
import { ServiceArea } from "@/domain/enums";

interface NewAdvertisementPageProps {
  readonly searchParams: Promise<{ readonly error?: string }>;
}

export default async function NewAdvertisementPage({
  searchParams,
}: NewAdvertisementPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  if (!canProviderPublish(provider)) {
    redirect("/painel/assinatura");
  }

  const hasAdSlot =
    isAdminProvider(provider) || (await providerHasAdSlotAvailable(provider.id));
  if (!hasAdSlot) {
    redirect(
      `/painel/anuncios?error=${encodeURIComponent(
        `Sua assinatura inclui ${PRICING.ADS_INCLUDED_PER_SUBSCRIPTION} anúncio. Filial = outro anúncio (+${formatPriceBRL(PRICING.EXTRA_AD_AMOUNT)}/mês). Fale conosco para liberar.`
      )}`
    );
  }

  const params = await searchParams;
  const [categories, states] = await Promise.all([
    getCategoriesWithCounts(),
    listActiveStates(),
  ]);
  const cities = PILOT_CITIES;
  const pilotStates = states.filter((state) =>
    PILOT_CITIES.some((city) => city.state === state.uf)
  );

  return (
    <PanelLayout>
      <h2 className="mb-3 text-lg font-semibold">Novo anúncio</h2>

      {params.error && (
        <p className="mb-2 max-w-xl rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
          {params.error}
        </p>
      )}

      <form
        action={createAdvertisementAction}
        encType="multipart/form-data"
        className="max-w-xl space-y-2.5"
      >
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Título
          </label>
          <Input id="title" name="title" required />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Descrição
          </label>
          <DescriptionEditor required minLength={20} rows={8} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
              defaultValue={ADVERTISEMENT_TYPE_OPTIONS[0].value}
            >
              {ADVERTISEMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <AdvertisementCategoryFields categories={categories} />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="city" className="mb-1 block text-sm font-medium">
              Cidade
            </label>
            <Input
              id="city"
              name="city"
              list="ad-cities"
              required
              defaultValue={PILOT_CITIES[0].name}
            />
            <datalist id="ad-cities">
              {cities.map((city) => (
                <option key={city.name} value={city.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="state" className="mb-1 block text-sm font-medium">
              UF
            </label>
            <select
              id="state"
              name="state"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
              defaultValue="PA"
            >
              {(pilotStates.length > 0 ? pilotStates : [{ id: "PA", uf: "PA" }]).map(
                (state) => (
                  <option key={state.id} value={state.uf}>
                    {state.uf}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label htmlFor="neighborhood" className="mb-1 block text-sm font-medium">
              Bairro{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="neighborhood"
              name="neighborhood"
              placeholder="Ex.: Nazaré — ou vazio se for delivery"
              minLength={2}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Deixe em branco se atende a cidade toda ou só faz delivery.
            </p>
          </div>
          <ServiceAreaField defaultValue={ServiceArea.CITY_WIDE} />
        </div>

        <div>
          <WhatsAppContactsFields
            defaultPrimaryNumber={toLocalWhatsAppDigits(provider.whatsapp)}
          />
        </div>

        <AdvertisementImageFields />

        <div className="flex gap-2">
          <Button type="submit" variant="whatsapp" size="sm">
            Publicar anúncio
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/painel/anuncios">Cancelar</Link>
          </Button>
        </div>
      </form>
    </PanelLayout>
  );
}
