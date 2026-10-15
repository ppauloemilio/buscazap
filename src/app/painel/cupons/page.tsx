import Link from "next/link";
import { redirect } from "next/navigation";
import { Ticket } from "lucide-react";
import {
  listCouponRedemptionsForPanel,
  listProviderCouponsForPanel,
} from "@/application/services/provider-coupon-service";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { ProviderCouponsManager } from "@/features/panel/components/provider-coupons-manager";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { canUsePlusFeatures } from "@/lib/plus-plan";
import { getCurrentProvider } from "@/lib/provider-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CouponsPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
  }>;
}

export default async function CouponsPage({ searchParams }: CouponsPageProps) {
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
            <CardTitle className="text-base">Cupons</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-sm text-muted-foreground">
            O Plano Pro ainda não está disponível na plataforma.
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
              <Ticket className="h-4 w-4 text-emerald-600" />
              Cupons — Plano Pro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            <p className="text-sm text-muted-foreground">
              Crie cupons com estoque limitado. O cliente gera um código único e
              envia no WhatsApp. Disponível no Plano Pro.
            </p>
            <Button variant="whatsapp" size="sm" asChild>
              <Link href="/painel/assinatura">Ver planos e fazer upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      </PanelLayout>
    );
  }

  const [coupons, redemptions] = await Promise.all([
    listProviderCouponsForPanel(provider.id),
    listCouponRedemptionsForPanel(provider.id),
  ]);

  return (
    <PanelLayout>
      {params.error && (
        <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {params.error}
        </div>
      )}
      {params.saved === "1" && (
        <div className="mb-3 rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp">
          Cupons atualizados.
        </div>
      )}

      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Ticket className="h-4 w-4 text-emerald-600" />
            Seus cupons
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <ProviderCouponsManager
            coupons={coupons.map((coupon) => ({
              ...coupon,
              startsAt: coupon.startsAt.toISOString(),
              endsAt: coupon.endsAt.toISOString(),
            }))}
            redemptions={redemptions.map((item) => ({
              ...item,
              issuedAt: item.issuedAt.toISOString(),
              usedAt: item.usedAt?.toISOString() ?? null,
            }))}
          />
        </CardContent>
      </Card>
    </PanelLayout>
  );
}
