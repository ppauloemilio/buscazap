import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDashboardStats } from "@/application/services/admin-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const stats = await getAdminDashboardStats();

  return (
    <AdminLayout>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prestadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.providersCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinaturas ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anúncios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.advertisementsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Destaques premium ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.premiumActiveCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagamentos confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.paidPayments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Denúncias abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.openReportsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinaturas vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.expiredSubscriptionsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prestadores bloqueados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.blockedProvidersCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/anuncios">Moderar anúncios</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/home">Visibilidade da home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/usuarios">Ver usuários</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/categorias">Gerenciar categorias</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/estados">Gerenciar estados</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/cidades">Gerenciar cidades</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/usuarios?subscription=expired">Assinaturas vencidas</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/denuncias">Ver denúncias</Link>
        </Button>
      </div>
    </AdminLayout>
  );
}
