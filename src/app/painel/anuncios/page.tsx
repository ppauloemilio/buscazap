import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, Plus } from "lucide-react";
import { findProviderAdvertisements } from "@/application/services/advertisement-service";
import { getCurrentProvider, canProviderPublish, isAdminProvider } from "@/lib/provider-session";
import { BoostAdvertisementForm } from "@/features/panel/components/boost-advertisement-form";
import { DeleteAdvertisementForm } from "@/features/panel/components/delete-advertisement-form";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PRICING } from "@/config/pricing";

interface ProviderAdsPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly deleted?: string;
    readonly boosted?: string;
  }>;
}

export default async function ProviderAdsPage({
  searchParams,
}: ProviderAdsPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const params = await searchParams;
  const subscriptionActive = canProviderPublish(provider);
  const isAdmin = isAdminProvider(provider);
  const advertisements = await findProviderAdvertisements(provider.id);
  const boostLabel = isAdmin
    ? "Destacar grátis"
    : `Destacar R$ ${PRICING.PREMIUM_BOOST_AMOUNT.toFixed(2).replace(".", ",")}`;
  const premiumAmountLabel = `R$ ${PRICING.PREMIUM_BOOST_AMOUNT.toFixed(2).replace(".", ",")}`;

  return (
    <PanelLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Meus anúncios</h2>
        {subscriptionActive ? (
          <Button variant="whatsapp" size="sm" asChild>
            <Link href="/painel/anuncios/novo">
              <Plus className="h-4 w-4" />
              Novo anúncio
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href="/painel/assinatura">Assinar para publicar</Link>
          </Button>
        )}
      </div>

      {params.error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      )}

      {params.deleted === "1" && (
        <div className="mb-4 rounded-lg bg-whatsapp/10 px-4 py-3 text-sm text-whatsapp">
          Anúncio excluído com sucesso.
        </div>
      )}

      {params.boosted === "1" && (
        <div className="mb-4 rounded-lg bg-whatsapp/10 px-4 py-3 text-sm text-whatsapp">
          Destaque premium ativado com sucesso.
        </div>
      )}

      {advertisements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Você ainda não tem anúncios publicados.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {advertisements.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{ad.title}</h3>
                    {ad.premiumActive && (
                      <Badge variant="premium" className="gap-1">
                        <Crown className="h-3 w-3" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ad.category} · {ad.location.city}
                  </p>
                  {ad.premiumExpiresAt && ad.premiumActive && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Destaque até{" "}
                      {new Date(ad.premiumExpiresAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/anuncio/${ad.id}`}>Ver</Link>
                  </Button>
                  {!ad.premiumActive && subscriptionActive && (
                    <BoostAdvertisementForm
                      advertisementId={ad.id}
                      label={boostLabel}
                    />
                  )}
                  <DeleteAdvertisementForm
                    advertisementId={ad.id}
                    advertisementTitle={ad.title}
                    premiumActive={ad.premiumActive}
                    premiumAmountLabel={premiumAmountLabel}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PanelLayout>
  );
}
