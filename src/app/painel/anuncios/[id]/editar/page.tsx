import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findProviderAdvertisementForEdit } from "@/application/services/advertisement-service";
import { AdvertisementImagesEditor } from "@/features/panel/components/advertisement-images-editor";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { getCurrentProvider } from "@/lib/provider-session";

interface EditAdvertisementImagesPageProps {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly boosted?: string;
  }>;
}

export default async function EditAdvertisementImagesPage({
  params,
  searchParams,
}: EditAdvertisementImagesPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const { id } = await params;
  const query = await searchParams;
  const advertisement = await findProviderAdvertisementForEdit(provider.id, id);

  if (!advertisement) {
    notFound();
  }

  if (!advertisement.premiumActive) {
    redirect("/painel/anuncios");
  }

  return (
    <PanelLayout>
      <div className="mb-6">
        <Link
          href="/painel/anuncios"
          className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar para meus anúncios
        </Link>
        <h2 className="text-xl font-semibold">Editar fotos do anúncio</h2>
        <p className="mt-1 text-sm text-muted-foreground">{advertisement.title}</p>
      </div>

      {query.boosted === "1" && (
        <div className="mb-4 rounded-lg bg-whatsapp/10 px-4 py-3 text-sm text-whatsapp">
          Destaque premium ativado! Agora você pode adicionar até 5 fotos extras na galeria.
        </div>
      )}

      {query.saved === "1" && (
        <div className="mb-4 rounded-lg bg-whatsapp/10 px-4 py-3 text-sm text-whatsapp">
          Fotos atualizadas com sucesso.
        </div>
      )}

      {query.error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {query.error}
        </div>
      )}

      <AdvertisementImagesEditor
        advertisementId={advertisement.id}
        title={advertisement.title}
        coverImage={advertisement.coverImage}
        galleryImages={advertisement.galleryImages}
        premiumActive={advertisement.premiumActive}
      />
    </PanelLayout>
  );
}
