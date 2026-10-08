import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Crown, Gift, Megaphone, Shield } from "lucide-react";
import { createSubscriptionPaymentAction } from "@/actions/provider-actions";
import { getSubscriptionStatus } from "@/application/services/subscription-service";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const freemium = isNewAdProfileEnabled();

  return (
    <PanelLayout>
      {isAdmin ? (
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-whatsapp" />
              Acesso administrativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            <div className="flex items-center justify-between rounded-lg bg-whatsapp/10 p-3">
              <div>
                <p className="text-sm font-medium">Conta de administrador</p>
                <p className="text-xs text-muted-foreground">
                  Sem cobrança de assinatura ou destaque premium
                </p>
              </div>
              <Badge variant="whatsapp">Liberado</Badge>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Megaphone className="h-3.5 w-3.5 text-whatsapp" />
                Publique anúncios sem pagar assinatura
              </li>
              <li className="flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-whatsapp" />
                Ative destaque premium gratuitamente
              </li>
            </ul>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">Ir para o painel admin</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {freemium && !status.active && (
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gift className="h-4 w-4 text-whatsapp" />
                  Seu plano atual: grátis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0">
                <p className="text-sm text-muted-foreground">
                  Você pode publicar listagem básica (nome, categoria, bairro e
                  WhatsApp). Faça upgrade abaixo para liberar o perfil completo.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/painel/anuncios/novo">Criar listagem grátis</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-whatsapp" />
                {status.active ? "Assinatura mensal" : "Upgrade para plano pago"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3 pt-0">
              {params.error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <p>{params.error}</p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-sm font-medium">
                    {status.active ? "Plano pago ativo" : "Plano pago"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês via PIX ·{" "}
                    {PRICING.ADS_INCLUDED_PER_SUBSCRIPTION} anúncio incluso
                  </p>
                </div>
                <Badge variant={status.active ? "whatsapp" : "secondary"}>
                  {status.active ? "Ativa" : freemium ? "Disponível" : "Inativa"}
                </Badge>
              </div>

              {status.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  {status.active ? "Válida até" : "Expirou em"}:{" "}
                  {status.expiresAt.toLocaleDateString("pt-BR")}
                </p>
              )}

              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Megaphone className="h-3.5 w-3.5 text-whatsapp" />
                  Perfil completo: capa, fotos, horário, produtos e serviços
                </li>
                <li className="flex items-center gap-2">
                  <Megaphone className="h-3.5 w-3.5 text-whatsapp" />
                  {PRICING.ADS_INCLUDED_PER_SUBSCRIPTION} anúncio incluso; filial
                  extra +{formatPriceBRL(PRICING.EXTRA_AD_AMOUNT)}/mês
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="h-3.5 w-3.5 text-whatsapp" />
                  Destaque: {formatPriceBRL(PRICING.PREMIUM_BOOST_AMOUNT)}/
                  {PRICING.PREMIUM_BOOST_DAYS}d pago ou{" "}
                  {PRICING.REFERRAL_PREMIUM_DAYS}d indicação
                </li>
              </ul>

              {!status.active ? (
                <form action={createSubscriptionPaymentAction}>
                  <Button
                    type="submit"
                    variant="whatsapp"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {freemium ? "Fazer upgrade agora" : "Fazer assinatura"}
                  </Button>
                </form>
              ) : status.canRenew ? (
                <form action={createSubscriptionPaymentAction}>
                  <Button
                    type="submit"
                    variant="whatsapp"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Renovar Assinatura
                  </Button>
                </form>
              ) : (
                <div className="space-y-1">
                  <Button
                    type="button"
                    variant="whatsapp"
                    size="sm"
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
                  {freemium
                    ? "Você continua com a listagem grátis até assinar. O upgrade libera o perfil completo imediatamente após a confirmação do PIX."
                    : "Sem assinatura ativa você não pode publicar novos anúncios."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PanelLayout>
  );
}
