import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Crown, Megaphone } from "lucide-react";
import { findProviderAdvertisements } from "@/application/services/advertisement-service";
import { getSubscriptionStatus } from "@/application/services/subscription-service";
import { getCurrentProvider, isAdminProvider } from "@/lib/provider-session";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRICING } from "@/config/pricing";

export default async function PanelPage() {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const [subscription, advertisements] = await Promise.all([
    getSubscriptionStatus(provider.id),
    findProviderAdvertisements(provider.id),
  ]);

  const premiumCount = advertisements.filter((ad) => ad.premiumActive).length;
  const isAdmin = isAdminProvider(provider);

  return (
    <PanelLayout>
      <div className="grid gap-2 sm:grid-cols-3">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-bold">
              {isAdmin ? "Admin" : subscription.active ? "Ativa" : "Inativa"}
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
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <Card>
          <CardContent className="p-3">
            <CreditCard className="mb-2 h-6 w-6 text-whatsapp" />
            <h3 className="text-sm font-semibold">Assinatura R$ 10/mês</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Necessária para publicar anúncios na plataforma.
            </p>
            <Button
              variant="whatsapp"
              size="sm"
              className="mt-2 w-full sm:w-auto"
              asChild
            >
              <Link href="/painel/assinatura">Gerenciar</Link>
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

      {!subscription.active && !isAdmin && (
        <Card className="mt-2 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-2 p-3 text-sm">
            <Megaphone className="h-4 w-4 shrink-0 text-amber-600" />
            <p>
              Sua assinatura está inativa.{" "}
              <Link href="/painel/assinatura" className="font-medium text-whatsapp hover:underline">
                Assine agora
              </Link>{" "}
              para publicar anúncios.
            </p>
          </CardContent>
        </Card>
      )}
    </PanelLayout>
  );
}
