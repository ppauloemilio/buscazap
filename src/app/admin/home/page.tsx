import { redirect } from "next/navigation";
import { LayoutGrid, MapPin, Zap } from "lucide-react";
import { updateHomepageSettingsAction } from "@/actions/admin-actions";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminHomeSettingsPageProps {
  readonly searchParams: Promise<{
    readonly saved?: string;
  }>;
}

const TOGGLES = [
  {
    name: "showUrgentSearches",
    label: "Precisa agora?",
    description: "Atalhos rápidos de Gás, Água, Delivery e outros.",
    icon: Zap,
  },
  {
    name: "showPopularCategories",
    label: "Categorias populares",
    description: "Grade de categorias na página inicial.",
    icon: LayoutGrid,
  },
  {
    name: "showCityExplorer",
    label: "Buscar por cidade",
    description: "Lista de cidades para explorar anúncios.",
    icon: MapPin,
  },
] as const;

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
          Escolha quais blocos aparecem na página inicial para os usuários.
        </p>
      </div>

      {params.saved === "1" && (
        <div className="mb-4 rounded-lg bg-whatsapp/10 px-4 py-3 text-sm text-whatsapp">
          Preferências da home salvas com sucesso.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blocos opcionais</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateHomepageSettingsAction} className="space-y-4">
            {TOGGLES.map((toggle) => {
              const Icon = toggle.icon;
              const checked = settings[toggle.name];

              return (
                <label
                  key={toggle.name}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    name={toggle.name}
                    defaultChecked={checked}
                    className="mt-1 h-4 w-4 accent-[hsl(var(--whatsapp))]"
                  />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-whatsapp/10">
                    <Icon className="h-4 w-4 text-whatsapp" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {toggle.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {toggle.description}
                    </span>
                  </span>
                </label>
              );
            })}

            <Button type="submit" variant="whatsapp">
              Salvar preferências
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
