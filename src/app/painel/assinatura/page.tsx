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
  cancelRecurringSubscriptionAction,
  createSubscriptionPaymentAction,
  downgradeToBasicPlanAction,
  startRecurringSubscriptionAction,
} from "@/actions/provider-actions";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { getSubscriptionStatus } from "@/application/services/subscription-service";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import {
  BASIC_PLAN_BENEFITS,
  FREE_PLAN_BENEFITS,
  FREE_PLAN_TAGLINE,
  PREMIUM_BOOST_BENEFITS,
  PREMIUM_BOOST_ELIGIBILITY,
  PRO_PLAN_EXTRA_BENEFITS,
} from "@/config/plan-marketing";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import { SubscriptionTier } from "@/domain/enums";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";
import {
  calculateProRataUpgradeAmount,
  isEligibleForProRataUpgrade,
} from "@/lib/subscription-proration";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubscriptionPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly downgraded?: string;
    readonly recurringCancelled?: string;
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

function RecurringSubscribeButton({
  tier,
  label,
}: {
  readonly tier: SubscriptionTier;
  readonly label: string;
}) {
  return (
    <form action={startRecurringSubscriptionAction}>
      <input type="hidden" name="tier" value={tier} />
      <Button type="submit" variant="outline" size="sm" className="w-full sm:w-auto">
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
  const canActivateRecurring =
    status.recurringEnabled &&
    !(status.recurring?.isActive || status.recurring?.isPending);
  const proRataUpgrade =
    status.active &&
    !isPlus &&
    status.expiresAt &&
    isEligibleForProRataUpgrade({
      role: provider.role,
      subscriptionExpiresAt: status.expiresAt,
      subscriptionTier: status.subscriptionTier,
    });
  const proRataAmount =
    proRataUpgrade && status.expiresAt
      ? calculateProRataUpgradeAmount(status.expiresAt)
      : null;

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
              Você voltou ao Plano Básico. As promoções deixam de aparecer
              na busca até fazer upgrade novamente.
            </div>
          )}

          {params.recurringCancelled === "1" && (
            <div className="rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp">
              Renovação automática cancelada. Sua assinatura atual continua
              válida até a data de vencimento.
            </div>
          )}

          {freemium && !status.active && (
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gift className="h-4 w-4 text-whatsapp" />
                  Seu plano atual: Plano Grátis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0">
                <p className="text-sm text-muted-foreground">{FREE_PLAN_TAGLINE}</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {FREE_PLAN_BENEFITS.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/painel/anuncios/novo">Criar anúncio no Plano Grátis</Link>
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
                {isPlus ? "Plano Pro" : "Plano Básico"}
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
                  Plano Básico
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
                  {BASIC_PLAN_BENEFITS.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                  <li>
                    {PRICING.ADS_INCLUDED_PER_SUBSCRIPTION} anúncio incluso na
                    mensalidade
                  </li>
                </ul>
                {status.active && !isPlus ? (
                  <Badge variant="whatsapp">Seu plano</Badge>
                ) : null}
                {!status.active ? (
                  <div className="flex flex-col gap-2">
                    <SubscriptionPayButton
                      tier={SubscriptionTier.BASIC}
                      label={
                        freemium
                          ? "Assinar com PIX (este mês)"
                          : "Fazer assinatura via PIX"
                      }
                    />
                    {canActivateRecurring ? (
                      <RecurringSubscribeButton
                        tier={SubscriptionTier.BASIC}
                        label="Renovação automática (cartão)"
                      />
                    ) : null}
                  </div>
                ) : status.canRenew && !isPlus ? (
                  <div className="flex flex-col gap-2">
                    <SubscriptionPayButton
                      tier={SubscriptionTier.BASIC}
                      label="Renovar via PIX"
                    />
                    {canActivateRecurring ? (
                      <RecurringSubscribeButton
                        tier={SubscriptionTier.BASIC}
                        label="Ativar renovação automática"
                      />
                    ) : null}
                  </div>
                ) : status.canRenew && isPlus ? (
                  <p className="text-xs text-muted-foreground">
                    Para renovar no Plano Básico, volte ao básico ou renove no Plano Pro.
                  </p>
                ) : status.active && !isPlus ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                      Renovação PIX disponível nos últimos{" "}
                      {status.renewalWindowDays} dias.
                    </p>
                    {canActivateRecurring ? (
                      <RecurringSubscribeButton
                        tier={SubscriptionTier.BASIC}
                        label="Ativar renovação automática"
                      />
                    ) : null}
                  </div>
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
                    Plano Pro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 pt-0">
                  <p className="text-xl font-bold text-whatsapp">
                    {proRataAmount != null
                      ? formatPriceBRL(proRataAmount)
                      : formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {proRataAmount != null ? " agora (proporcional)" : " /mês"}
                    </span>
                  </p>
                  {proRataAmount != null && status.expiresAt ? (
                    <p className="text-xs text-muted-foreground">
                      Você paga só a diferença até{" "}
                      {status.expiresAt.toLocaleDateString("pt-BR")}. O Plano Pro
                      começa na hora, com a mesma data de vencimento. Na renovação,
                      escolha Básico ou Pro.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Assinatura mensal completa. Na renovação, escolha Básico ou
                      Pro.
                    </p>
                  )}
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {PRO_PLAN_EXTRA_BENEFITS.map((benefit) => (
                      <li
                        key={benefit}
                        className={
                          benefit.includes("PROMOÇÕES")
                            ? "flex items-center gap-1.5 font-medium"
                            : undefined
                        }
                      >
                        {benefit.includes("PROMOÇÕES") ? (
                          <>
                            <Tag className="h-3.5 w-3.5 shrink-0 text-whatsapp" />
                            {benefit}
                          </>
                        ) : (
                          benefit
                        )}
                      </li>
                    ))}
                  </ul>
                  {status.active && isPlus ? (
                    <Badge variant="whatsapp">Seu plano</Badge>
                  ) : null}
                  {!status.active ? (
                    <div className="flex flex-col gap-2">
                      <SubscriptionPayButton
                        tier={SubscriptionTier.PLUS}
                        label="Assinar Pro via PIX"
                      />
                      {canActivateRecurring ? (
                        <RecurringSubscribeButton
                          tier={SubscriptionTier.PLUS}
                          label="Pro com renovação automática"
                        />
                      ) : null}
                    </div>
                  ) : !isPlus ? (
                    <div className="flex flex-col gap-2">
                      <SubscriptionPayButton
                        tier={SubscriptionTier.PLUS}
                        label={
                          proRataAmount != null
                            ? `Upgrade Pro PIX (${formatPriceBRL(proRataAmount)})`
                            : "Upgrade Pro via PIX"
                        }
                      />
                      {canActivateRecurring ? (
                        <div className="space-y-2 rounded-md border border-amber-200/80 bg-amber-50/80 p-2.5 text-xs text-amber-950">
                          <p className="font-medium">Atenção — upgrade no cartão</p>
                          <p>
                            Se pagar o upgrade com cartão, será cobrada a
                            mensalidade Pro cheia (
                            {formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)}
                            ): o Pro ativa na hora, inicia um ciclo novo e fica
                            com renovação automática no cartão.
                          </p>
                          <p>
                            Se preferir pagar só a diferença e manter a data de
                            vencimento atual, use o upgrade via PIX acima.
                            Depois você pode cadastrar a recorrência no cartão
                            sem cobrança até o vencimento.
                          </p>
                          <RecurringSubscribeButton
                            tier={SubscriptionTier.PLUS}
                            label={`Upgrade Pro no cartão (${formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)}/mês)`}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : status.canRenew ? (
                    <div className="flex flex-col gap-2">
                      <SubscriptionPayButton
                        tier={SubscriptionTier.PLUS}
                        label="Renovar Pro via PIX"
                      />
                      {canActivateRecurring ? (
                        <RecurringSubscribeButton
                          tier={SubscriptionTier.PLUS}
                          label="Ativar renovação automática"
                        />
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground">
                        Renovação PIX disponível nos últimos{" "}
                        {status.renewalWindowDays} dias.
                      </p>
                      {canActivateRecurring ? (
                        <RecurringSubscribeButton
                          tier={SubscriptionTier.PLUS}
                          label="Ativar renovação automática"
                        />
                      ) : null}
                    </div>
                  )}
                  {status.active && isPlus && (
                    <form action={downgradeToBasicPlanAction}>
                      <Button type="submit" variant="outline" size="sm">
                        Voltar ao Plano Básico
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {status.recurringEnabled ? (
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-whatsapp" />
                  Renovação automática
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0 text-sm">
                {status.recurring?.isActive ? (
                  <>
                    <p>
                      Ativa no{" "}
                      <span className="font-medium">
                        {status.recurring.tier === SubscriptionTier.PLUS
                          ? "Plano Pro"
                          : "Plano Básico"}
                      </span>
                      . O Mercado Pago cobra no cartão todo mês.
                    </p>
                    <form action={cancelRecurringSubscriptionAction}>
                      <Button type="submit" variant="outline" size="sm">
                        Cancelar renovação automática
                      </Button>
                    </form>
                  </>
                ) : status.recurring?.isPending ? (
                  <>
                    <p className="text-muted-foreground">
                      Checkout pendente no Mercado Pago. Conclua o pagamento no
                      cartão ou cancele e tente de novo.
                    </p>
                    <form action={cancelRecurringSubscriptionAction}>
                      <Button type="submit" variant="outline" size="sm">
                        Cancelar checkout pendente
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      No plano atual: vincule o cartão sem cobrança até o
                      vencimento. Para ir ao Pro pagando só a diferença, use o
                      PIX no card do Plano Pro e depois ative a recorrência
                      aqui. É necessário ter e-mail em{" "}
                      <Link
                        href="/painel/perfil"
                        className="text-whatsapp underline"
                      >
                        Meu perfil
                      </Link>
                      .
                    </p>
                    {status.active ? (
                      <RecurringSubscribeButton
                        tier={
                          isPlus
                            ? SubscriptionTier.PLUS
                            : SubscriptionTier.BASIC
                        }
                        label="Ativar renovação automática"
                      />
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="space-y-2 p-3 pt-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Crown className="h-3.5 w-3.5 text-whatsapp" />
                Destaque premium — {formatPriceBRL(PRICING.PREMIUM_BOOST_AMOUNT)}/
                {PRICING.PREMIUM_BOOST_DAYS} dias (opcional)
              </p>
              <p className="text-xs text-muted-foreground">
                {PREMIUM_BOOST_ELIGIBILITY}
              </p>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {PREMIUM_BOOST_BENEFITS.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
              {status.active ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/painel/anuncios">Destacar em Meus anúncios</Link>
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Assine o Plano Básico ou Pro para liberar o destaque.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PanelLayout>
  );
}
