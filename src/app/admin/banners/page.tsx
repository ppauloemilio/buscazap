import Link from "next/link";
import { redirect } from "next/navigation";
import { listSponsorBannersForAdmin } from "@/application/services/sponsor-banner-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminSponsorBannersManager } from "@/features/admin/components/admin-sponsor-banners-manager";
import { getCurrentAdmin } from "@/lib/admin-session";

interface AdminBannersPageProps {
  readonly searchParams: Promise<{
    readonly saved?: string;
    readonly error?: string;
  }>;
}

export default async function AdminBannersPage({
  searchParams,
}: AdminBannersPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const banners = await listSponsorBannersForAdmin();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Banners patrocinados</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Carrossel comercial da home (abaixo das categorias, por padrão). Para
          exibir na vitrine, libere em{" "}
          <Link href="/admin/home" className="font-medium text-whatsapp underline">
            Admin → Home
          </Link>
          .
        </p>
      </div>

      {params.saved === "1" && (
        <div className="mb-4 rounded-lg bg-whatsapp/10 px-4 py-3 text-sm text-whatsapp">
          Banners atualizados com sucesso.
        </div>
      )}
      {params.error ? (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}

      <AdminSponsorBannersManager banners={banners} />
    </AdminLayout>
  );
}
