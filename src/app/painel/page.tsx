import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Crown, Megaphone, Eye, MousePointerClick } from "lucide-react";
import { findProviderAdvertisements } from "@/application/services/advertisement-service";
import { getProviderAnalyticsReport } from "@/application/services/analytics-service";
import { getSubscriptionStatus } from "@/application/services/subscription-service";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";
import { isFreeListingProvider } from "@/lib/free-listing";
import { FreePanelOverview } from "@/features/panel/components/free-panel-overview";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PanelPage() {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const [subscription, advertisements, stats] = await Promise.all([
    getSubscriptionStatus(provider.id),
    findProviderAdvertisements(provider.id),
    getProviderAnalyticsReport(provider.id, 30),
  ]);

  const premiumCount = advertisements.filter((ad) => ad.premiumActive).length;
  const isAdmin = isAdminProvider(provider);
  const freemium = isNewAdProfileEnabled();
  const freeListing = isFreeListingProvider(provider);
  const firstAd = advertisements[0];

  return (
    <PanelLayout>
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
                  ? "Pago"
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

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <Card>
          <CardContent className="p-3">
            <CreditCard className="mb-2 h-6 w-6 text-whatsapp" />
            <h3 className="text-sm font-semibold">
              {subscription.active
                ? `Plano pago ${formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês`
                : freemium
                  ? `Upgrade ${formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês`
                  : `Assinatura ${formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês`}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {subscription.active
                ? "Perfil completo ativo. Gerencie renovação e extras."
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
        <Card>
          <CardContent className="p-3">
            <Crown className="mb-2 h-6 w-6 text-whatsapp" />
            <h3 className="text-sm font-semibold">
              Destaque R$ {PRICING.PREMIUM_BOOST_AMOUNT}/30 dias
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Badge premium e prioridade na busca por anúncio.
            </p>
            <Button
              variant="whatsapp"
              size="sm"
              className="mt-2 w-full sm:w-auto"
              asChild
            >
              <Link href="/painel/anuncios">Destacar anúncio</Link>
            </Button>
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
                  Você está no plano grátis.{" "}
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
