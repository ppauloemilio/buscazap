import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreditCard,
  Crown,
  Gift,
  Megaphone,
  Shield,
  Sparkles,
  Tag,
} from "lucide-react";
import {
  createSubscriptionPaymentAction,
  downgradeToBasicPlanAction,
} from "@/actions/provider-actions";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { getSubscriptionStatus } from "@/application/services/subscription-service";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import { SubscriptionTier } from "@/domain/enums";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubscriptionPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly downgraded?: string;
  }>;
}

function SubscriptionPayButton({
  tier,
  label,
  variant = "whatsapp",
}: {
  readonly tier: SubscriptionTier;
  readonly label: string;
  readonly variant?: "whatsapp" | "outline";
}) {
  return (
    <form action={createSubscriptionPaymentAction}>
      <input type="hidden" name="tier" value={tier} />
      <Button type="submit" variant={variant} size="sm" className="w-full sm:w-auto">
        {label}
      </Button>
    </form>
  );
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
  const homepage = await getHomepageSettings();
  const plusOffer = homepage.plusPlanEnabled;
  const isPlus = status.subscriptionTier === SubscriptionTier.PLUS;

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
          {params.downgraded === "1" && (
            <div className="rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp">
              Você voltou ao plano pago básico. As promoções deixam de aparecer
              na busca até fazer upgrade novamente.
            </div>
          )}

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
                  Listagem básica ativa. Escolha um plano pago abaixo para o
                  perfil completo
                  {plusOffer ? " ou promoções no Plus" : ""}.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/painel/anuncios/novo">Criar listagem grátis</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {params.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {params.error}
            </div>
          )}

          {status.expiresAt && status.active && (
            <p className="text-xs text-muted-foreground">
              Assinatura válida até{" "}
              {status.expiresAt.toLocaleDateString("pt-BR")} · Plano atual:{" "}
              <span className="font-medium text-foreground">
                {isPlus ? "Plus" : "Pago básico"}
              </span>
            </p>
          )}

          <div
            className={cn(
              "grid gap-3",
              plusOffer ? "md:grid-cols-2" : "max-w-xl"
            )}
          >
            <Card
              className={cn(
                status.active && !isPlus && "border-whatsapp/40 ring-1 ring-whatsapp/20"
              )}
            >
              <CardHeader className="p-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-whatsapp" />
                  Plano pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <p className="text-xl font-bold">
                  {formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mês
                  </span>
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>Perfil completo e produtos/serviços</li>
                  <li>
                    {PRICING.ADS_INCLUDED_PER_SUBSCRIPTION} anúncio incluso
                  </li>
                </ul>
                {status.active && !isPlus ? (
                  <Badge variant="whatsapp">Seu plano</Badge>
                ) : null}
                {!status.active ? (
                  <SubscriptionPayButton
                    tier={SubscriptionTier.BASIC}
                    label={freemium ? "Assinar plano pago" : "Fazer assinatura"}
                  />
                ) : status.canRenew && !isPlus ? (
                  <SubscriptionPayButton
                    tier={SubscriptionTier.BASIC}
                    label="Renovar plano pago"
                  />
                ) : status.canRenew && isPlus ? (
                  <p className="text-xs text-muted-foreground">
                    Para renovar no plano pago, volte ao básico ou renove no Plus.
                  </p>
                ) : status.active && !isPlus ? (
                  <p className="text-xs text-muted-foreground">
                    Renovação disponível nos últimos {status.renewalWindowDays}{" "}
                    dias.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {plusOffer && (
              <Card
                className={cn(
                  "border-whatsapp/30",
                  status.active &&
                    isPlus &&
                    "border-whatsapp ring-1 ring-whatsapp/25"
                )}
              >
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-whatsapp" />
                    Plano Plus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 pt-0">
                  <p className="text-xl font-bold text-whatsapp">
                    {formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mês
                    </span>
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>Tudo do plano pago</li>
                    <li className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-whatsapp" />
                      Até {PRICING.PLUS_MAX_PROMOTIONS} promoções divulgadas
                    </li>
                  </ul>
                  {status.active && isPlus ? (
                    <Badge variant="whatsapp">Seu plano</Badge>
                  ) : null}
                  {!status.active ? (
                    <SubscriptionPayButton
                      tier={SubscriptionTier.PLUS}
                      label="Assinar Plano Plus"
                    />
                  ) : !isPlus ? (
                    <SubscriptionPayButton
                      tier={SubscriptionTier.PLUS}
                      label="Upgrade para Plus"
                    />
                  ) : status.canRenew ? (
                    <SubscriptionPayButton
                      tier={SubscriptionTier.PLUS}
                      label="Renovar Plano Plus"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Renovação disponível nos últimos{" "}
                      {status.renewalWindowDays} dias.
                    </p>
                  )}
                  {status.active && isPlus && (
                    <form action={downgradeToBasicPlanAction}>
                      <Button type="submit" variant="outline" size="sm">
                        Voltar ao plano pago básico
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardContent className="space-y-2 p-3 pt-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Crown className="h-3.5 w-3.5 text-whatsapp" />
                Destaque premium: {formatPriceBRL(PRICING.PREMIUM_BOOST_AMOUNT)}/
                {PRICING.PREMIUM_BOOST_DAYS}d (opcional, em Meus anúncios)
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </PanelLayout>
  );
}
