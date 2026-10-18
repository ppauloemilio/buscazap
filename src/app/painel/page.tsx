import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreditCard,
  Crown,
  Megaphone,
  Eye,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { createSubscriptionPaymentAction } from "@/actions/provider-actions";
import { findProviderAdvertisements } from "@/application/services/advertisement-service";
import { getProviderAnalyticsReport } from "@/application/services/analytics-service";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { getSubscriptionStatus } from "@/application/services/subscription-service";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { PRO_PLAN_EXTRA_BENEFITS } from "@/config/plan-marketing";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import { SubscriptionTier } from "@/domain/enums";
import {
  canPurchasePremiumBoost,
  getCurrentProvider,
  isAdminProvider,
} from "@/lib/provider-session";
import { calculateProRataUpgradeAmount } from "@/lib/subscription-proration";
import { isFreeListingProvider } from "@/lib/free-listing";
import { FreePanelOverview } from "@/features/panel/components/free-panel-overview";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PanelPageProps {
  readonly searchParams: Promise<{ readonly claimed?: string }>;
}

export default async function PanelPage({ searchParams }: PanelPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const params = await searchParams;

  const [subscription, advertisements, stats, homepage] = await Promise.all([
    getSubscriptionStatus(provider.id),
    findProviderAdvertisements(provider.id),
    getProviderAnalyticsReport(provider.id, 30),
    getHomepageSettings(),
  ]);

  const premiumCount = advertisements.filter((ad) => ad.premiumActive).length;
  const isAdmin = isAdminProvider(provider);
  const freemium = isNewAdProfileEnabled();
  const freeListing = isFreeListingProvider(provider);
  const canBuyPremium = canPurchasePremiumBoost(provider);
  const isPlus = subscription.subscriptionTier === SubscriptionTier.PLUS;
  const plusOffer = homepage.plusPlanEnabled;
  const showProUpgrade =
    plusOffer && subscription.active && !isPlus && !isAdmin;
  const proRataAmount =
    showProUpgrade && provider.subscriptionExpiresAt
      ? calculateProRataUpgradeAmount(provider.subscriptionExpiresAt)
      : null;
  const firstAd = advertisements[0];

  return (
    <PanelLayout>
      {params.claimed === "1" ? (
        <div className="mb-4 rounded-lg border border-whatsapp/30 bg-whatsapp/10 px-3 py-3 text-sm">
          <p className="font-medium text-foreground">
            Anúncio reivindicado com sucesso
          </p>
          <p className="mt-1 text-muted-foreground">
            Você já está logado. Seu login é o WhatsApp desta conta. A senha
            que você acabou de definir pode ser alterada quando quiser em{" "}
            <Link href="/painel/perfil" className="text-whatsapp underline">
              Meu perfil
            </Link>
            .
          </p>
        </div>
      ) : null}
      {freeListing ? (
        <FreePanelOverview
          advertisementCount={advertisements.length}
          firstAdId={firstAd?.id}
          firstAdPublicHref={firstAd?.publicHref}
        />
      ) : (
        <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-bold">
              {isAdmin
                ? "Admin"
                : subscription.active
                  ? isPlus
                    ? "Pro"
                    : "Básico"
                  : freemium
                    ? "Grátis"
                    : "Inativo"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Anúncios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-bold">{advertisements.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Em destaque
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-bold">{premiumCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Eye className="h-3 w-3" />
              Visitas (30d)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-bold">{stats.totals.adViews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <MousePointerClick className="h-3 w-3" />
              WhatsApp (30d)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-bold">{stats.totals.whatsappClicks}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/painel/estatisticas">Ver estatísticas detalhadas</Link>
        </Button>
      </div>

      <div
        className={
          showProUpgrade
            ? "mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3"
            : "mt-3 grid gap-2 md:grid-cols-2"
        }
      >
        <Card>
          <CardContent className="p-3">
            <CreditCard className="mb-2 h-6 w-6 text-whatsapp" />
            <h3 className="text-sm font-semibold">
              {subscription.active
                ? isPlus
                  ? `Plano Pro ${formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)}/mês`
                  : `Plano Básico ${formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês`
                : freemium
                  ? `Upgrade ${formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês`
                  : `Assinatura ${formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês`}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {subscription.active
                ? isPlus
                  ? "Plano Pro ativo. Gerencie renovação e promoções."
                  : "Perfil completo ativo. Gerencie renovação e extras."
                : freemium
                  ? "Libere capa, fotos, horário, produtos e serviços."
                  : "Necessária para publicar anúncios na plataforma."}
            </p>
            <Button
              variant="whatsapp"
              size="sm"
              className="mt-2 w-full sm:w-auto"
              asChild
            >
              <Link href="/painel/assinatura">
                {subscription.active
                  ? "Gerenciar"
                  : freemium
                    ? "Fazer upgrade"
                    : "Assinar"}
              </Link>
            </Button>
          </CardContent>
        </Card>
        {showProUpgrade ? (
          <Card className="border-whatsapp/35 ring-1 ring-whatsapp/15">
            <CardContent className="p-3">
              <Sparkles className="mb-2 h-6 w-6 text-whatsapp" />
              <h3 className="text-sm font-semibold">
                Upgrade Plano Pro
                {proRataAmount != null
                  ? ` — ${formatPriceBRL(proRataAmount)}`
                  : ` — ${formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)}/mês`}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {proRataAmount != null && provider.subscriptionExpiresAt
                  ? `Pro-rata até ${provider.subscriptionExpiresAt.toLocaleDateString("pt-BR")}. Mesma data de vencimento; na renovação você escolhe Básico ou Pro.`
                  : "Promoções na busca, limites ampliados e tudo do Básico."}
              </p>
              <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                {PRO_PLAN_EXTRA_BENEFITS.slice(1, 4).map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2">
                <form action={createSubscriptionPaymentAction}>
                  <input type="hidden" name="tier" value={SubscriptionTier.PLUS} />
                  <Button type="submit" variant="whatsapp" size="sm">
                    {proRataAmount != null
                      ? `Upgrade (${formatPriceBRL(proRataAmount)})`
                      : "Upgrade para Plano Pro"}
                  </Button>
                </form>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/painel/assinatura">Ver detalhes</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardContent className="p-3">
            <Crown className="mb-2 h-6 w-6 text-whatsapp" />
            <h3 className="text-sm font-semibold">
              Destaque R$ {PRICING.PREMIUM_BOOST_AMOUNT}/30 dias
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {canBuyPremium || isAdmin
                ? "Opcional no Plano Básico ou Pro: badge, prioridade na busca e fotos extras."
                : "Disponível após assinar Plano Básico ou Pro (não no Plano Grátis)."}
            </p>
            {canBuyPremium || isAdmin ? (
              <Button
                variant="whatsapp"
                size="sm"
                className="mt-2 w-full sm:w-auto"
                asChild
              >
                <Link href="/painel/anuncios">Destacar anúncio</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full sm:w-auto"
                asChild
              >
                <Link href="/painel/assinatura">Ver planos pagos</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {!subscription.active && !isAdmin && !freeListing && (
        <Card className="mt-2 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-2 p-3 text-sm">
            <Megaphone className="h-4 w-4 shrink-0 text-amber-600" />
            <p>
              {freemium ? (
                <>
                  Você está no Plano Grátis.{" "}
                  <Link
                    href="/painel/assinatura"
                    className="font-medium text-whatsapp hover:underline"
                  >
                    Faça upgrade
                  </Link>{" "}
                  para o perfil completo quando quiser.
                </>
              ) : (
                <>
                  Sua assinatura está inativa.{" "}
                  <Link
                    href="/painel/assinatura"
                    className="font-medium text-whatsapp hover:underline"
                  >
                    Assine agora
                  </Link>{" "}
                  para publicar anúncios.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </PanelLayout>
  );
}
