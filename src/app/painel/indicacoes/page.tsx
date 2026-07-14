import { redirect } from "next/navigation";
import { Gift, Share2, Crown } from "lucide-react";
import { getReferralDashboard } from "@/application/services/referral-service";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { ReferralShareActions } from "@/features/panel/components/referral-share-actions";
import { getCurrentProvider } from "@/lib/provider-session";
import { buildAbsoluteUrl } from "@/lib/site-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRICING } from "@/config/pricing";

export default async function ReferralsPage() {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const dashboard = await getReferralDashboard(provider.id);
  const invitePath = `/cadastro?ref=${encodeURIComponent(dashboard.referralCode)}`;
  const inviteUrl = buildAbsoluteUrl(invitePath);

  return (
    <PanelLayout>
      <h2 className="mb-1 text-lg font-semibold">Indicações</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Indique {PRICING.REFERRALS_PER_PREMIUM_CREDIT} anunciantes e ganhe 1 destaque
        premium grátis de {PRICING.REFERRAL_PREMIUM_DAYS} dias. Destaque pago continua
        com {PRICING.PREMIUM_BOOST_DAYS} dias.
      </p>

      <div className="mb-2 grid gap-2 sm:grid-cols-3">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Seu código
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-lg font-bold tracking-wider">{dashboard.referralCode}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Indicados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-bold">{dashboard.referralCount}</p>
            <p className="text-[11px] text-muted-foreground">
              Faltam {dashboard.remainingForCredit} para o próximo crédito
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Créditos premium
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 p-3 pt-0">
            <Crown className="h-4 w-4 text-whatsapp" />
            <p className="text-xl font-bold">{dashboard.freePremiumCredits}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-2">
        <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Link de indicação</p>
              <p className="truncate text-xs text-muted-foreground">{inviteUrl}</p>
            </div>
          </div>
          <ReferralShareActions
            inviteUrl={inviteUrl}
            referralCode={dashboard.referralCode}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-whatsapp" />
            Anunciantes indicados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {dashboard.referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há indicações. Compartilhe seu código para começar.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {dashboard.referrals.map((referral) => (
                <li
                  key={referral.id}
                  className="flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{referral.referredName}</p>
                    <p className="text-xs text-muted-foreground">
                      {referral.referredEmail}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {referral.createdAt.toLocaleDateString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PanelLayout>
  );
}
