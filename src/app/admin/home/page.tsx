import { redirect } from "next/navigation";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { HomepageSectionsForm } from "@/features/admin/components/homepage-sections-form";
import { getCurrentAdmin } from "@/lib/admin-session";

interface AdminHomeSettingsPageProps {
  readonly searchParams: Promise<{
    readonly saved?: string;
  }>;
}

export default async function AdminHomeSettingsPage({
  searchParams,
}: AdminHomeSettingsPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const settings = await getHomepageSettings();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Visibilidade da home</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha quais blocos aparecem na página inicial e a ordem de exibição.
        </p>
      </div>

      {params.saved === "1" && (
        <div className="mb-4 rounded-lg bg-whatsapp/10 px-4 py-3 text-sm text-whatsapp">
          Preferências da home salvas com sucesso.
        </div>
      )}

      <HomepageSectionsForm settings={settings} />
    </AdminLayout>
  );
}
