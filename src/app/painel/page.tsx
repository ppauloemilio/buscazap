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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {isAdmin ? "Admin" : subscription.active ? "Ativa" : "Inativa"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anúncios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{advertisements.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em destaque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{premiumCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <CreditCard className="mb-3 h-8 w-8 text-whatsapp" />
            <h3 className="font-semibold">Assinatura R$ 10/mês</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Necessária para publicar anúncios na plataforma.
            </p>
            <Button
              variant="whatsapp"
              size="sm"
              className="mt-4 w-full sm:w-auto"
              asChild
            >
              <Link href="/painel/assinatura">Gerenciar</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Crown className="mb-3 h-8 w-8 text-whatsapp" />
            <h3 className="font-semibold">
              Destaque R$ {PRICING.PREMIUM_BOOST_AMOUNT}/30 dias
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Badge premium e prioridade na busca por anúncio.
            </p>
            <Button
              variant="whatsapp"
              size="sm"
              className="mt-4 w-full sm:w-auto"
              asChild
            >
              <Link href="/painel/anuncios">Destacar anúncio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {!subscription.active && !isAdmin && (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <Megaphone className="h-5 w-5 text-amber-600" />
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
