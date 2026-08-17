import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminReferrerDetail } from "@/application/services/referral-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import {
  getAdminAdStatusLabel,
  getAdminProviderStatusLabel,
} from "@/config/admin";
import { getCurrentAdmin } from "@/lib/admin-session";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminReferrerDetailPageProps {
  readonly params: Promise<{ readonly providerId: string }>;
}

export default async function AdminReferrerDetailPage({
  params,
}: AdminReferrerDetailPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const { providerId } = await params;
  const detail = await getAdminReferrerDetail(providerId);

  if (!detail) {
    notFound();
  }

  return (
    <AdminLayout>
      <div className="mb-4">
        <Link
          href="/admin/indicacoes"
          className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar para indicações
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">{detail.name}</h2>
          <Badge variant="outline">
            {getAdminProviderStatusLabel(detail.status)}
          </Badge>
          <Badge variant="secondary">Código {detail.referralCode}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatWhatsAppDisplay(detail.whatsapp)}
          {detail.email ? ` · ${detail.email}` : ""}
          {" · "}
          {detail.referralCount} indicação
          {detail.referralCount === 1 ? "" : "ões"}
          {" · "}
          {detail.publishedAdsCount} anúncio
          {detail.publishedAdsCount === 1 ? "" : "s"} publicado
          {detail.publishedAdsCount === 1 ? "" : "s"} pelos indicados
          {" · "}
          {detail.freePremiumCredits} crédito
          {detail.freePremiumCredits === 1 ? "" : "s"} disponível
          {detail.freePremiumCredits === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Crédito a cada {detail.adsPerCredit} anúncios publicados. Faltam{" "}
          {detail.remainingForCredit} para o próximo.
        </p>
        <div className="mt-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/usuarios/${detail.id}/editar`}>
              Editar usuário
            </Link>
          </Button>
        </div>
      </div>

      {detail.referrals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Este usuário ainda não tem indicações registradas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {detail.referrals.map((referral) => (
            <Card key={referral.id}>
              <CardHeader className="space-y-2 p-4 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {referral.referred.name}
                  </CardTitle>
                  <Badge variant="outline">
                    {getAdminProviderStatusLabel(referral.referred.status)}
                  </Badge>
                </div>
                <p className="text-sm font-normal text-muted-foreground">
                  Indicado em {referral.createdAt.toLocaleDateString("pt-BR")}
                  {" · "}
                  {formatWhatsAppDisplay(referral.referred.whatsapp)}
                  {referral.referred.email
                    ? ` · ${referral.referred.email}`
                    : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/usuarios/${referral.referred.id}/editar`}>
                      Ver usuário
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/admin/anuncios?providerId=${referral.referred.id}`}
                    >
                      Ver anúncios
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {referral.referred.advertisements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Este indicado ainda não tem anúncios.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {referral.referred.advertisements.map((ad) => (
                      <li
                        key={ad.id}
                        className="flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{ad.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {ad.category} · {ad.city}/{ad.state} ·{" "}
                            {getAdminAdStatusLabel(ad.status)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/anuncios/${ad.id}/editar`}>
                            Abrir anúncio
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
