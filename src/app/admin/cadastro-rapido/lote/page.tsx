import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminBulkFreeListingImport } from "@/features/admin/components/admin-bulk-free-listing-import";
import { listActiveCatalogLocationOptions } from "@/application/services/catalog-location";
import { getCurrentAdmin } from "@/lib/admin-session";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminBulkFreeListingPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const freemium = isNewAdProfileEnabled();
  const { cities } = freemium
    ? await listActiveCatalogLocationOptions()
    : { cities: [] as const };

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Importar anúncios grátis (CSV)</h2>
          <p className="text-sm text-muted-foreground">
            Envie um CSV com nome, categoria, bairro e WhatsApp. Pré-visualize,
            teste os números no wa.me e confirme a criação em lote. Linhas sem
            bairro pedem a cidade na pré-visualização.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/cadastro-rapido">Cadastro unitário</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/cadastro-rapido/avisos">Avisar importados</Link>
          </Button>
        </div>
      </div>

      {!freemium ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Ative <code className="text-xs">NEXT_PUBLIC_NEW_AD_PROFILE</code> para
            usar a importação em lote.
          </CardContent>
        </Card>
      ) : (
        <AdminBulkFreeListingImport cities={cities} />
      )}
    </AdminLayout>
  );
}
