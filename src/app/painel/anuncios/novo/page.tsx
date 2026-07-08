import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdvertisementAction } from "@/actions/provider-actions";
import { ADVERTISEMENT_TYPE_OPTIONS } from "@/config/advertisement-form";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { getCurrentProvider, hasActiveSubscription } from "@/lib/provider-session";
import {
  getCategoriesWithCounts,
  listActiveCities,
  listActiveStates,
} from "@/application/services/catalog-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRICING } from "@/config/pricing";

interface NewAdvertisementPageProps {
  readonly searchParams: Promise<{ readonly error?: string }>;
}

export default async function NewAdvertisementPage({
  searchParams,
}: NewAdvertisementPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  if (!hasActiveSubscription(provider.subscriptionExpiresAt)) {
    redirect("/painel/assinatura");
  }

  const params = await searchParams;
  const [categories, states, cities] = await Promise.all([
    getCategoriesWithCounts(),
    listActiveStates(),
    listActiveCities(),
  ]);

  return (
    <PanelLayout>
      <h2 className="mb-6 text-xl font-semibold">Novo anúncio</h2>

      {params.error && (
        <p className="mb-4 max-w-xl rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      )}

      <form action={createAdvertisementAction} className="max-w-xl space-y-4">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
            Título
          </label>
          <Input id="title" name="title" required />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className="mb-1.5 block text-sm font-medium">
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

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="city" className="mb-1.5 block text-sm font-medium">
              Cidade
            </label>
            <Input id="city" name="city" list="ad-cities" required />
            <datalist id="ad-cities">
              {cities.map((city) => (
                <option key={city.id} value={city.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="state" className="mb-1.5 block text-sm font-medium">
              UF
            </label>
            <select
              id="state"
              name="state"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
              defaultValue={provider.state ?? states[0]?.uf ?? ""}
            >
              {states.map((state) => (
                <option key={state.id} value={state.uf}>
                  {state.uf}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="neighborhood" className="mb-1.5 block text-sm font-medium">
            Bairro (opcional)
          </label>
          <Input id="neighborhood" name="neighborhood" />
        </div>

        <div>
          <label htmlFor="whatsappNumber" className="mb-1.5 block text-sm font-medium">
            WhatsApp
          </label>
          <Input
            id="whatsappNumber"
            name="whatsappNumber"
            defaultValue={provider.whatsapp}
            required
          />
        </div>

        <label className="flex items-start gap-3 rounded-lg border p-4">
          <input type="checkbox" name="withPremium" className="mt-1" />
          <div>
            <p className="text-sm font-medium">
              Destacar este anúncio (+ R${" "}
              {PRICING.PREMIUM_BOOST_AMOUNT.toFixed(2).replace(".", ",")} / 30 dias)
            </p>
            <p className="text-xs text-muted-foreground">
              Badge premium, seção de destaques e prioridade na busca.
            </p>
          </div>
        </label>

        <div className="flex gap-3">
          <Button type="submit" variant="whatsapp">
            Publicar anúncio
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/painel/anuncios">Cancelar</Link>
          </Button>
        </div>
      </form>
    </PanelLayout>
  );
}
