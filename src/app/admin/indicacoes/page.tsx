import Link from "next/link";
import { redirect } from "next/navigation";
import { Gift } from "lucide-react";
import { listAdminReferrers } from "@/application/services/referral-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AdminReferralsPageProps {
  readonly searchParams: Promise<{
    readonly days?: string;
  }>;
}

export default async function AdminReferralsPage({
  searchParams,
}: AdminReferralsPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const days = params.days === "7" ? 7 : undefined;
  const createdSince = days
    ? (() => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
      })()
    : undefined;

  const referrers = await listAdminReferrers({ createdSince });

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Indicações</h2>
          <p className="text-sm text-muted-foreground">
            {days
              ? "Usuários com pelo menos uma indicação válida nos últimos 7 dias."
              : "Usuários com pelo menos uma indicação válida e a quantidade de indicados."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={!days ? "default" : "outline"} size="sm" asChild>
            <Link href="/admin/indicacoes">Todas</Link>
          </Button>
          <Button variant={days === 7 ? "default" : "outline"} size="sm" asChild>
            <Link href="/admin/indicacoes?days=7">Últimos 7 dias</Link>
          </Button>
        </div>
      </div>

      {referrers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum usuário com indicação válida
            {days ? " neste período" : ""}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {referrers.map((referrer) => (
            <Card key={referrer.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{referrer.name}</h3>
                    <Badge variant="secondary">
                      Código {referrer.referralCode}
                    </Badge>
                    <Badge variant="outline">
                      {referrer.publishedAdsCount} anúncio
                      {referrer.publishedAdsCount === 1 ? "" : "s"} publicado
                      {referrer.publishedAdsCount === 1 ? "" : "s"}
                    </Badge>
                    {referrer.freePremiumCredits > 0 && (
                      <Badge variant="whatsapp">
                        {referrer.freePremiumCredits} crédito(s) premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatWhatsAppDisplay(referrer.whatsapp)}
                    {referrer.email ? ` · ${referrer.email}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="whatsapp" size="sm" asChild>
                    <Link
                      href={
                        days
                          ? `/admin/indicacoes/${referrer.id}?days=7`
                          : `/admin/indicacoes/${referrer.id}`
                      }
                    >
                      <Gift className="h-3.5 w-3.5" />
                      {referrer.referralCount} indicação
                      {referrer.referralCount === 1 ? "" : "ões"}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/usuarios/${referrer.id}/editar`}>
                      Ver usuário
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
