import { redirect } from "next/navigation";
import { getAdminCategoryStats } from "@/application/services/admin-service";
import { CATEGORIES } from "@/infrastructure/data/mock-dashboard";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminCategoriesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const stats = await getAdminCategoryStats();
  const statsMap = new Map(stats.map((item) => [item.name, item.advertisementsCount]));

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold">Categorias</h2>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Categorias padrão da plataforma</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground">/{category.slug}</p>
              </div>
              <Badge variant="secondary">
                {statsMap.get(category.name) ?? 0} anúncio(s)
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {stats.some((item) => !item.isKnown) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias personalizadas (Outro)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats
              .filter((item) => !item.isKnown)
              .map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <p className="font-medium">{item.name}</p>
                  <Badge variant="outline">{item.advertisementsCount} anúncio(s)</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
