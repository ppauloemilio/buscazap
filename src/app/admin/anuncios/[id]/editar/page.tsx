import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import {
  adminRemoveAdvertisementGalleryImageAction,
  adminUpdateAdvertisementAction,
  adminUpdateAdvertisementImagesAction,
} from "@/actions/admin-actions";
import { findAdvertisementForAdminEdit } from "@/application/services/admin-service";
import { resolveAdvertisementNotifyContext } from "@/application/services/advertisement-notify-service";
import { getCategoriesWithCounts } from "@/application/services/catalog-service";
import {
  listActiveCatalogLocationOptions,
} from "@/application/services/catalog-location";
import { ADVERTISEMENT_TYPE_OPTIONS } from "@/config/advertisement-form";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminAdvertisementNotifyActions } from "@/features/admin/components/admin-advertisement-notify-actions";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { AdvertisementImagesEditor } from "@/features/panel/components/advertisement-images-editor";
import { LocationFields } from "@/features/panel/components/location-fields";
import { ServiceAreaField } from "@/features/panel/components/service-area-field";
import { WhatsAppContactsFields } from "@/features/panel/components/whatsapp-contacts-fields";
import { DescriptionEditor } from "@/components/advertisement/description-editor";
import { getCurrentAdmin } from "@/lib/admin-session";
import { toLocalWhatsAppDigits } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdvertisementType } from "@/domain/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminEditAdvertisementPageProps {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly notify?: string;
    readonly password?: string;
  }>;
}

export default async function AdminEditAdvertisementPage({
  params,
  searchParams,
}: AdminEditAdvertisementPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const { id } = await params;
  const query = await searchParams;
  const [advertisement, categories, notify, locationOptions] = await Promise.all([
    findAdvertisementForAdminEdit(id),
    getCategoriesWithCounts(),
    resolveAdvertisementNotifyContext(id).catch(() => null),
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
    <AdminLayout>
      <div className="mb-4">
        <Link
          href="/admin/anuncios"
          className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar para anúncios
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">Editar anúncio</h2>
          <Badge variant="outline">{advertisement.provider.name}</Badge>
        </div>
        {notify && (
          <div className="mt-3">
            <AdminAdvertisementNotifyActions
              advertisementId={advertisement.id}
              notifyHref={notify.notifyHref}
              hasStoredPassword={notify.hasStoredPassword}
              returnTo={`/admin/anuncios/${advertisement.id}/editar`}
            />
          </div>
        )}
      </div>

      {query.notify?.trim() && (
        <div className="mb-3 space-y-2 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          <p className="font-medium">
            {query.password === "1"
              ? "Senha provisória gerada. Abra o WhatsApp para enviar ao anunciante."
              : "Mensagem pronta para o anunciante."}
          </p>
          <Button size="sm" variant="whatsapp" asChild>
            <a href={query.notify} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-3.5 w-3.5" />
              Abrir WhatsApp
            </a>
          </Button>
        </div>
      )}

      {query.saved === "1" && (
        <p className="mb-3 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Anúncio salvo com sucesso.{" "}
          <Link href={`/anuncio/${advertisement.id}`} className="underline" target="_blank">
            Ver página pública
          </Link>
        </p>
      )}

      {query.error && (
        <p className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {query.error}
        </p>
      )}

      <form
        action={adminUpdateAdvertisementAction}
        encType="multipart/form-data"
        className="max-w-2xl space-y-3 rounded-xl border bg-card p-4"
      >
        <input type="hidden" name="advertisementId" value={advertisement.id} />

        <div>
          <label className="mb-1 block text-sm font-medium">Título</label>
          <Input name="title" defaultValue={advertisement.title} required minLength={5} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descrição</label>
          <DescriptionEditor
            defaultValue={advertisement.description}
            required
            minLength={20}
            rows={10}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo</label>
            <select
              name="type"
              defaultValue={typeDefault}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              {ADVERTISEMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <AdvertisementCategoryFields
              categories={categories}
              defaultCategory={advertisement.category}
            />
          </div>
        </div>

        <LocationFields
          states={locationOptions.states}
          cities={locationOptions.cities}
          defaultCity={advertisement.city}
          defaultState={advertisement.state}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Bairro{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              name="neighborhood"
              defaultValue={advertisement.neighborhood ?? ""}
              placeholder="Ex.: Nazaré — ou vazio se for delivery"
              minLength={2}
            />
          </div>
          <ServiceAreaField
            defaultValue={advertisement.serviceArea}
            showHint={false}
          />
        </div>

        <WhatsAppContactsFields
          showPricingNotes={false}
          defaultPrimaryNumber={toLocalWhatsAppDigits(advertisement.whatsappNumber)}
          defaultPrimaryLabel={advertisement.whatsappLabel ?? ""}
          defaultSecondaryNumber={
            advertisement.secondaryWhatsappNumber
              ? toLocalWhatsAppDigits(advertisement.secondaryWhatsappNumber)
              : ""
          }
          defaultSecondaryLabel={advertisement.secondaryWhatsappLabel ?? ""}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="whatsapp">
            Salvar anúncio
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/anuncio/${advertisement.id}`} target="_blank">
              Ver público
            </Link>
          </Button>
        </div>
      </form>

      <Card className="mt-4 max-w-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fotos (capa e galeria premium)</CardTitle>
          <p className="text-sm font-normal text-muted-foreground">
            {advertisement.premiumActive
              ? "Premium ativo: você pode alterar a capa e a galeria."
              : "Altere a capa e, se necessário, prepare a galeria (visível ao público só com premium ativo)."}
          </p>
        </CardHeader>
        <CardContent>
          <AdvertisementImagesEditor
            advertisementId={advertisement.id}
            title={advertisement.title}
            coverImage={advertisement.coverImage}
            galleryImages={advertisement.galleryImages}
            premiumActive={advertisement.premiumActive}
            forceGalleryEdit
            backHref="/admin/anuncios"
            updateAction={adminUpdateAdvertisementImagesAction}
            removeGalleryAction={adminRemoveAdvertisementGalleryImageAction}
          />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
