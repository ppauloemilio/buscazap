import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { findPrimaryProviderAdvertisementForPanel } from "@/application/services/advertisement-service";
import { AdvertisementProductsEditor } from "@/features/panel/components/advertisement-products-editor";
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
  title: "Produtos",
};

interface ProductsPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const params = await searchParams;
  const simpleListing = shouldUseSimpleFreeListingUx(provider);
  const fullProfile = hasFullListingProfile(provider);
  const newProfile = isNewAdProfileEnabled();
  const { maxProducts } = getLimitsForProvider(provider);

  if (simpleListing || !newProfile || !fullProfile) {
    return (
      <PanelLayout>
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-whatsapp" />
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            <p className="text-sm text-muted-foreground">
              Cadastre até {PRICING.PAID_MAX_PRODUCTS} produtos no plano pago (
              {formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês). No Pro, o
              limite sobe para {PRICING.PRO_MAX_PRODUCTS}.
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
            <Package className="h-4 w-4 text-whatsapp" />
            Produtos ({advertisement?.editProducts.length ?? 0}/{maxProducts})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 pt-0">
          {params.saved === "1" ? (
            <p className="rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
              Produtos atualizados.
            </p>
          ) : null}
          {params.error ? (
            <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}

          {!advertisement ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Publique um anúncio para cadastrar produtos.</p>
              <Button variant="whatsapp" size="sm" asChild>
                <Link href="/painel/anuncios/novo">Novo anúncio</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Vinculados ao anúncio &quot;{advertisement.title}&quot;.
              </p>
              <AdvertisementProductsEditor
                advertisementId={advertisement.id}
                products={advertisement.editProducts}
                maxProducts={maxProducts}
              />
            </>
          )}
        </CardContent>
      </Card>
    </PanelLayout>
  );
}
