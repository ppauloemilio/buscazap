import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminUpdateAdvertisementAction } from "@/actions/admin-actions";
import { findAdvertisementForAdminEdit } from "@/application/services/admin-service";
import { getCategoriesWithCounts } from "@/application/services/catalog-service";
import { ADVERTISEMENT_TYPE_OPTIONS } from "@/config/advertisement-form";
import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import { PILOT_CITIES } from "@/config/pricing";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { DescriptionEditor } from "@/components/advertisement/description-editor";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdvertisementType } from "@/domain/enums";

interface AdminEditAdvertisementPageProps {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
  }>;
}

const ACCEPT = ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes.join(",");

export default async function AdminEditAdvertisementPage({
  params,
  searchParams,
}: AdminEditAdvertisementPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const { id } = await params;
  const query = await searchParams;
  const [advertisement, categories] = await Promise.all([
    findAdvertisementForAdminEdit(id),
    getCategoriesWithCounts(),
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
      </div>

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

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Cidade</label>
            <Input
              name="city"
              list="admin-edit-ad-cities"
              defaultValue={advertisement.city}
              required
            />
            <datalist id="admin-edit-ad-cities">
              {PILOT_CITIES.map((city) => (
                <option key={city.name} value={city.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">UF</label>
            <Input name="state" defaultValue={advertisement.state} maxLength={2} required />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Bairro (opcional)</label>
            <Input
              name="neighborhood"
              defaultValue={advertisement.neighborhood ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">WhatsApp do anúncio</label>
            <Input
              name="whatsappNumber"
              defaultValue={advertisement.whatsappNumber}
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Foto de capa</label>
          {advertisement.coverImageUrl && (
            <img
              src={advertisement.coverImageUrl}
              alt="Capa atual"
              className="mb-2 h-40 w-full max-w-sm rounded-md border bg-muted object-contain"
            />
          )}
          <input
            name="coverImage"
            type="file"
            accept={ACCEPT}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {advertisement.coverImageUrl
              ? "Envie um arquivo novo para substituir a capa."
              : "Opcional. JPG, PNG ou WebP · máx. 5 MB."}
          </p>
        </div>

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
    </AdminLayout>
  );
}
