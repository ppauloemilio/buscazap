import { redirect } from "next/navigation";
import { CreditCard, Crown, Megaphone, Shield } from "lucide-react";
import { createSubscriptionPaymentAction } from "@/actions/provider-actions";
import { getSubscriptionStatus } from "@/application/services/subscription-service";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRICING } from "@/config/pricing";

interface SubscriptionPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
  }>;
}

export default async function SubscriptionPage({
  searchParams,
}: SubscriptionPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const params = await searchParams;
  const status = await getSubscriptionStatus(provider.id);
  const isAdmin = isAdminProvider(provider);

  return (
    <PanelLayout>
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-whatsapp" />
              Acesso administrativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-whatsapp/10 p-4">
              <div>
                <p className="font-medium">Conta de administrador</p>
                <p className="text-sm text-muted-foreground">
                  Sem cobrança de assinatura ou destaque premium
                </p>
              </div>
              <Badge variant="whatsapp">Liberado</Badge>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-whatsapp" />
                Publique anúncios sem pagar assinatura
              </li>
              <li className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-whatsapp" />
                Ative destaque premium gratuitamente
              </li>
            </ul>
            <Button variant="outline" asChild>
              <a href="/admin">Ir para o painel admin</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-whatsapp" />
            Assinatura mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p>{params.error}</p>
              {params.error.toLowerCase().includes("authorization") && (
                <p className="mt-2 text-xs">
                  Confira na Vercel se <strong>MERCADOPAGO_ACCESS_TOKEN</strong>{" "}
                  está preenchido com o token <strong>TEST-...</strong> do
                  Mercado Pago (ambiente Production) e faça redeploy.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div>
              <p className="font-medium">Plano Anunciante</p>
              <p className="text-sm text-muted-foreground">
                R$ {PRICING.SUBSCRIPTION_AMOUNT.toFixed(2).replace(".", ",")}/mês
                via PIX
              </p>
            </div>
            <Badge variant={status.active ? "whatsapp" : "secondary"}>
              {status.active ? "Ativa" : "Inativa"}
            </Badge>
          </div>

          {status.expiresAt && (
            <p className="text-sm text-muted-foreground">
              {status.active ? "Válida até" : "Expirou em"}:{" "}
              {status.expiresAt.toLocaleDateString("pt-BR")}
            </p>
          )}

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-whatsapp" />
              Publique anúncios na plataforma
            </li>
            <li className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-whatsapp" />
              Destaque premium: R${" "}
              {PRICING.PREMIUM_BOOST_AMOUNT.toFixed(2).replace(".", ",")}/
              {PRICING.PREMIUM_BOOST_DAYS} dias (pago) ou{" "}
              {PRICING.REFERRAL_PREMIUM_DAYS} dias (indicação)
            </li>
          </ul>

          {!status.active ? (
            <form action={createSubscriptionPaymentAction}>
              <Button type="submit" variant="whatsapp" className="w-full sm:w-auto">
                Fazer assinatura
              </Button>
            </form>
          ) : status.canRenew ? (
            <form action={createSubscriptionPaymentAction}>
              <Button type="submit" variant="whatsapp" className="w-full sm:w-auto">
                Renovar Assinatura
              </Button>
            </form>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                variant="whatsapp"
                className="w-full sm:w-auto"
                disabled
              >
                Renovar Assinatura
              </Button>
              <p className="text-xs text-muted-foreground">
                A renovação fica disponível nos últimos{" "}
                {status.renewalWindowDays} dias da assinatura.
              </p>
            </div>
          )}

          {!status.active && (
            <p className="text-xs text-muted-foreground">
              Sem assinatura ativa você não pode publicar novos anúncios.
            </p>
          )}
        </CardContent>
      </Card>
      )}
    </PanelLayout>
  );
}
