import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateAdvertisementAction } from "@/actions/provider-actions";
import { findProviderAdvertisementForEdit } from "@/application/services/advertisement-service";
import { getCategoriesWithCounts } from "@/application/services/catalog-service";
import { listActiveCatalogLocationOptions } from "@/application/services/catalog-location";
import { ADVERTISEMENT_TYPE_OPTIONS } from "@/config/advertisement-form";
import { DescriptionEditor } from "@/components/advertisement/description-editor";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { AdvertisementImagesEditor } from "@/features/panel/components/advertisement-images-editor";
import { LocationFields } from "@/features/panel/components/location-fields";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { ServiceAreaField } from "@/features/panel/components/service-area-field";
import { WhatsAppContactsFields } from "@/features/panel/components/whatsapp-contacts-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdvertisementType } from "@/domain/enums";
import { getCurrentProvider } from "@/lib/provider-session";
import { toLocalWhatsAppDigits } from "@/lib/whatsapp";

interface EditAdvertisementPageProps {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly boosted?: string;
  }>;
}

export default async function EditAdvertisementPage({
  params,
  searchParams,
}: EditAdvertisementPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const { id } = await params;
  const query = await searchParams;
  const [advertisement, categories, locationOptions] = await Promise.all([
    findProviderAdvertisementForEdit(provider.id, id),
    getCategoriesWithCounts(),
    listActiveCatalogLocationOptions(),
  ]);

  if (!advertisement) {
    notFound();
  }

  const typeDefault = Object.values(AdvertisementType).includes(
    advertisement.type as AdvertisementType
  )
    ? advertisement.type
    : AdvertisementType.SERVICE;

  return (
    <PanelLayout>
      <div className="mb-3">
        <Link
          href="/painel/anuncios"
          className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar para meus anúncios
        </Link>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Pencil className="h-4 w-4 text-whatsapp" />
          Editar anúncio
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{advertisement.title}</p>
      </div>

      {query.boosted === "1" && (
        <div className="mb-2 rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp">
          Destaque premium ativado! Agora você pode adicionar até 5 fotos extras
          na galeria abaixo.
        </div>
      )}

      {query.saved === "1" && (
        <div className="mb-2 rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp">
          Anúncio atualizado com sucesso.{" "}
          <Link
            href={advertisement.publicHref ?? `/anuncio/${advertisement.id}`}
            className="underline"
            target="_blank"
          >
            Ver página pública
          </Link>
        </div>
      )}

      {query.error && (
        <div className="mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {query.error}
        </div>
      )}

      <form
        action={updateAdvertisementAction}
        className="mb-6 max-w-xl space-y-2.5"
      >
        <input type="hidden" name="advertisementId" value={advertisement.id} />

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Título
          </label>
          <Input
            id="title"
            name="title"
            defaultValue={advertisement.title}
            required
            minLength={5}
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Descrição
          </label>
          <DescriptionEditor
            defaultValue={advertisement.description}
            required
            minLength={20}
            rows={8}
          />
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
              defaultValue={typeDefault}
            >
              {ADVERTISEMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <AdvertisementCategoryFields
            categories={categories}
            defaultCategory={advertisement.category}
          />
        </div>

        <LocationFields
          states={locationOptions.states}
          cities={locationOptions.cities}
          defaultCity={advertisement.location.city}
          defaultState={advertisement.location.state}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label
              htmlFor="neighborhood"
              className="mb-1 block text-sm font-medium"
            >
              Bairro{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="neighborhood"
              name="neighborhood"
              defaultValue={advertisement.location.neighborhood ?? ""}
              placeholder="Ex.: Nazaré — ou vazio se for delivery"
              minLength={2}
            />
          </div>
          <ServiceAreaField defaultValue={advertisement.serviceArea} />
        </div>

        <WhatsAppContactsFields
          defaultPrimaryNumber={toLocalWhatsAppDigits(
            advertisement.whatsappNumber
          )}
          defaultPrimaryLabel={advertisement.whatsappLabel ?? ""}
          defaultSecondaryNumber={
            advertisement.secondaryWhatsappNumber
              ? toLocalWhatsAppDigits(advertisement.secondaryWhatsappNumber)
              : ""
          }
          defaultSecondaryLabel={advertisement.secondaryWhatsappLabel ?? ""}
        />

        <div className="flex gap-2 pt-1">
          <Button type="submit" variant="whatsapp" size="sm">
            Salvar alterações
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/painel/anuncios">Cancelar</Link>
          </Button>
        </div>
      </form>

      {advertisement.premiumActive ? (
        <div className="max-w-xl space-y-2 border-t pt-4">
          <h3 className="text-base font-semibold">Fotos</h3>
          <p className="text-xs text-muted-foreground">
            Altere a capa e a galeria premium (até 5 fotos extras).
          </p>
          <AdvertisementImagesEditor
            advertisementId={advertisement.id}
            title={advertisement.title}
            coverImage={advertisement.coverImage}
            galleryImages={advertisement.galleryImages}
            premiumActive={advertisement.premiumActive}
          />
        </div>
      ) : (
        <div className="max-w-xl rounded-lg border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
          Para alterar a foto de capa e adicionar galeria, ative o{" "}
          <Link href="/painel/anuncios" className="font-medium text-whatsapp hover:underline">
            destaque premium
          </Link>
          .
        </div>
      )}
    </PanelLayout>
  );
}
