import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import { findPrimaryProviderAdvertisementForPanel } from "@/application/services/advertisement-service";
import { AdvertisementServicesEditor } from "@/features/panel/components/advertisement-services-editor";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import {
  hasFullListingProfile,
  shouldUseSimpleFreeListingUx,
} from "@/lib/free-listing";
import { getCurrentProvider } from "@/lib/provider-session";
import { getLimitsForProvider } from "@/lib/subscription-limits";

export const metadata: Metadata = {
  title: "Serviços",
};

interface ServicesPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
  }>;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const params = await searchParams;
  const simpleListing = shouldUseSimpleFreeListingUx(provider);
  const fullProfile = hasFullListingProfile(provider);
  const newProfile = isNewAdProfileEnabled();
  const { maxServices } = getLimitsForProvider(provider);

  if (simpleListing || !newProfile || !fullProfile) {
    return (
      <PanelLayout>
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4 text-whatsapp" />
              Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            <p className="text-sm text-muted-foreground">
              Cadastre até {PRICING.PAID_MAX_SERVICES} serviços no plano pago (
              {formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês). No Pro, o
              limite sobe para {PRICING.PRO_MAX_SERVICES}.
            </p>
            <Button variant="whatsapp" size="sm" asChild>
              <Link href="/painel/assinatura">Ver planos</Link>
            </Button>
          </CardContent>
        </Card>
      </PanelLayout>
    );
  }

  const advertisement = await findPrimaryProviderAdvertisementForPanel(
    provider.id
  );

  return (
    <PanelLayout>
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-whatsapp" />
            Serviços ({advertisement?.editServices.length ?? 0}/{maxServices})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 pt-0">
          {params.saved === "1" ? (
            <p className="rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
              Serviços atualizados.
            </p>
          ) : null}
          {params.error ? (
            <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}

          {!advertisement ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Publique um anúncio para cadastrar serviços.</p>
              <Button variant="whatsapp" size="sm" asChild>
                <Link href="/painel/anuncios/novo">Novo anúncio</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Vinculados ao anúncio &quot;{advertisement.title}&quot;.
              </p>
              <AdvertisementServicesEditor
                advertisementId={advertisement.id}
                services={advertisement.editServices}
                maxServices={maxServices}
              />
            </>
          )}
        </CardContent>
      </Card>
    </PanelLayout>
  );
}
