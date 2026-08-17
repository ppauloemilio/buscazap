import Link from "next/link";
import { getAdminDashboardStats } from "@/application/services/admin-service";
import { countNewProviderLeads } from "@/application/services/provider-lead-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function StatCard({
  title,
  value,
  href,
  hint,
}: {
  readonly title: string;
  readonly value: number;
  readonly href: string;
  readonly hint?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl outline-none ring-offset-background transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition hover:border-whatsapp/50 hover:shadow-sm">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-2xl font-bold">{value}</p>
          {hint ? (
            <p className="text-[11px] text-muted-foreground">{hint}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">Ver detalhes →</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

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
        <StatCard
          title="Leads novos"
          value={newLeadsCount}
          href="/admin/leads?status=NEW"
        />
        <StatCard
          title="Cadastros (7 dias)"
          value={stats.providersLast7Days}
          href="/admin/usuarios?created=7"
        />
        <StatCard
          title="Indicações (7 dias)"
          value={stats.referralsLast7Days}
          href="/admin/relatorios"
        />
        <StatCard
          title="Em trial ativo"
          value={stats.trialActiveCount}
          href="/admin/usuarios?subscription=trial"
        />
        <StatCard
          title="Assinantes pagos"
          value={stats.paidSubscriptionsCount}
          href="/admin/usuarios?subscription=paid"
          hint={`${stats.signupsLast30Days} cadastros em 30 dias`}
        />
        <StatCard
          title="Sem anúncio"
          value={stats.providersWithoutAdsCount}
          href="/admin/usuarios?ads=none"
          hint="Usuários cadastrados sem nenhum anúncio"
        />
        <StatCard
          title="Anúncios vencidos"
          value={stats.expiredAdsCount}
          href="/admin/anuncios?subscription=expired"
          hint="Anúncios com assinatura vencida"
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Anunciantes"
          value={stats.providersCount}
          href="/admin/usuarios"
        />
        <StatCard
          title="Assinaturas ativas"
          value={stats.activeSubscriptions}
          href="/admin/usuarios?subscription=active"
        />
        <StatCard
          title="Anúncios"
          value={stats.advertisementsCount}
          href="/admin/anuncios"
        />
        <StatCard
          title="Destaques premium"
          value={stats.premiumActiveCount}
          href="/admin/anuncios?premium=1"
        />
        <StatCard
          title="Denúncias abertas"
          value={stats.openReportsCount}
          href="/admin/denuncias"
        />
        <StatCard
          title="Sugestões de categoria"
          value={stats.pendingCategorySuggestions}
          href="/admin/categorias"
        />
      </div>

      {stats.adsByCity.length > 0 && (
        <Card className="mt-3">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Anúncios por cidade</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ul className="space-y-1">
              {stats.adsByCity.map((row) => (
                <li key={row.city}>
                  <Link
                    href={`/admin/anuncios?city=${encodeURIComponent(row.city)}`}
                    className="flex items-center justify-between rounded border px-2.5 py-1.5 text-sm transition hover:border-whatsapp/50 hover:bg-muted/40"
                  >
                    <span>{row.city}</span>
                    <span className="font-semibold">{row.count}</span>
                  </Link>
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
          <Link href="/admin/anuncios?subscription=expired">Anúncios vencidos</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/usuarios?subscription=expired">Assinaturas vencidas</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/relatorios">Relatórios</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/home">Home</Link>
        </Button>
      </div>
    </AdminLayout>
  );
}
