import Link from "next/link";
import { getAdminDashboardStats } from "@/application/services/admin-service";
import { countNewProviderLeads } from "@/application/services/provider-lead-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const [stats, newLeadsCount] = await Promise.all([
    getAdminDashboardStats(),
    countNewProviderLeads(),
  ]);

  return (
    <AdminLayout>
      <h2 className="mb-3 text-lg font-semibold">Visão geral do piloto</h2>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Leads novos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{newLeadsCount}</p>
            <Button variant="link" className="h-auto p-0 text-xs" asChild>
              <Link href="/admin/leads?status=NEW">Ver pré-cadastros</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Cadastros (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{stats.providersLast7Days}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Indicações (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{stats.referralsLast7Days}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Em trial ativo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{stats.trialActiveCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Assinantes pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{stats.paidSubscriptionsCount}</p>
            <p className="text-[11px] text-muted-foreground">
              {stats.signupsLast30Days} cadastros em 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Anunciantes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{stats.providersCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Assinaturas ativas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Anúncios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{stats.advertisementsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Destaques premium
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{stats.premiumActiveCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Denúncias abertas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{stats.openReportsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Sugestões de categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-bold">{stats.pendingCategorySuggestions}</p>
          </CardContent>
        </Card>
      </div>

      {stats.adsByCity.length > 0 && (
        <Card className="mt-3">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Anúncios por cidade</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ul className="space-y-1">
              {stats.adsByCity.map((row) => (
                <li
                  key={row.city}
                  className="flex items-center justify-between rounded border px-2.5 py-1.5 text-sm"
                >
                  <span>{row.city}</span>
                  <span className="font-semibold">{row.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href="/admin/denuncias">Moderar denúncias</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/categorias">Sugestões de categoria</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/anuncios">Moderar anúncios</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/usuarios?subscription=expired">Assinaturas vencidas</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/home">Home</Link>
        </Button>
      </div>
    </AdminLayout>
  );
}
