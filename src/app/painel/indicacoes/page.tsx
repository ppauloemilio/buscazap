import { redirect } from "next/navigation";
import { Gift, Share2, Crown } from "lucide-react";
import { getReferralDashboard } from "@/application/services/referral-service";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { getCurrentProvider } from "@/lib/provider-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/config/pricing";

export default async function ReferralsPage() {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const dashboard = await getReferralDashboard(provider.id);
  const invitePath = `/cadastro?ref=${encodeURIComponent(dashboard.referralCode)}`;

  return (
    <PanelLayout>
      <h2 className="mb-4 text-xl font-semibold">Indicações</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Indique {PRICING.REFERRALS_PER_PREMIUM_CREDIT} anunciantes e ganhe 1 destaque
        premium grátis de {PRICING.REFERRAL_PREMIUM_DAYS} dias. Destaque pago continua
        com {PRICING.PREMIUM_BOOST_DAYS} dias.
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Seu código
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tracking-wider">{dashboard.referralCode}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Indicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dashboard.referralCount}</p>
            <p className="text-xs text-muted-foreground">
              Faltam {dashboard.remainingForCredit} para o próximo crédito
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Créditos premium
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-whatsapp" />
            <p className="text-2xl font-bold">{dashboard.freePremiumCredits}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Share2 className="mt-0.5 h-5 w-5 text-whatsapp" />
            <div>
              <p className="text-sm font-semibold">Link de indicação</p>
              <p className="break-all text-xs text-muted-foreground">{invitePath}</p>
            </div>
          </div>
          <Button variant="whatsapp" size="sm" asChild>
            <a href={invitePath}>Abrir cadastro com meu código</a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-whatsapp" />
            Anunciantes indicados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há indicações. Compartilhe seu código para começar.
            </p>
          ) : (
            <ul className="space-y-2">
              {dashboard.referrals.map((referral) => (
                <li
                  key={referral.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
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
