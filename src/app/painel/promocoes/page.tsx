import Link from "next/link";
import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import { listProviderPromotionsForPanel } from "@/application/services/provider-promotion-service";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { ProviderPromotionsManager } from "@/features/panel/components/provider-promotions-manager";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { canUsePlusFeatures } from "@/lib/plus-plan";
import { getCurrentProvider } from "@/lib/provider-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PromotionsPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
  }>;
}

export default async function PromotionsPage({ searchParams }: PromotionsPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const params = await searchParams;
  const settings = await getHomepageSettings();
  const plusAllowed = settings.plusPlanEnabled;
  const canManage = await canUsePlusFeatures(provider);

  if (!plusAllowed) {
    return (
      <PanelLayout>
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-base">Promoções</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-sm text-muted-foreground">
            O Plano Plus ainda não está disponível na plataforma.
          </CardContent>
        </Card>
      </PanelLayout>
    );
  }

  if (!canManage) {
    return (
      <PanelLayout>
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4 text-whatsapp" />
              Promoções — Plano Plus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            <p className="text-sm text-muted-foreground">
              Divulgue até 3 promoções com foto, descrição, preço original e
              promocional. Disponível no Plano Plus.
            </p>
            <Button variant="whatsapp" size="sm" asChild>
              <Link href="/painel/assinatura">Ver planos e fazer upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      </PanelLayout>
    );
  }

  const promotions = (await listProviderPromotionsForPanel(provider.id)).map(
    (promo) => ({
      ...promo,
      startsAt: promo.startsAt.toISOString(),
      endsAt: promo.endsAt.toISOString(),
    })
  );

  return (
    <PanelLayout>
      {params.error && (
        <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {params.error}
        </div>
      )}
      {params.saved === "1" && (
        <div className="mb-3 rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp">
          Promoções atualizadas.
        </div>
      )}

      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4 text-whatsapp" />
            Suas promoções
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <ProviderPromotionsManager promotions={promotions} />
        </CardContent>
      </Card>
    </PanelLayout>
  );
}
