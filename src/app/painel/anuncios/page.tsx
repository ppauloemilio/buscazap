import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, ImageIcon } from "lucide-react";
import { findProviderAdvertisements, providerHasAdSlotAvailable } from "@/application/services/advertisement-service";
import { getCurrentProvider, canProviderPublish, isAdminProvider } from "@/lib/provider-session";
import { BoostAdvertisementForm } from "@/features/panel/components/boost-advertisement-form";
import { DeleteAdvertisementForm } from "@/features/panel/components/delete-advertisement-form";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPriceBRL, PRICING } from "@/config/pricing";

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
  const hasAdSlot = isAdmin || (await providerHasAdSlotAvailable(provider.id));
  const boostLabel = isAdmin
    ? "Destacar grátis"
    : `Destacar ${formatPriceBRL(PRICING.PREMIUM_BOOST_AMOUNT)} (30 dias)`;
  const premiumAmountLabel = formatPriceBRL(PRICING.PREMIUM_BOOST_AMOUNT);
  const freeCredits = isAdmin ? 0 : provider.freePremiumCredits;

  return (
    <PanelLayout>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Meus anúncios</h2>
        {subscriptionActive && hasAdSlot ? (
          <Button variant="whatsapp" size="sm" asChild>
            <Link href="/painel/anuncios/novo">Novo anúncio</Link>
          </Button>
        ) : subscriptionActive && !hasAdSlot ? (
          <p className="max-w-xs text-right text-xs text-muted-foreground">
            Limite de {PRICING.ADS_INCLUDED_PER_SUBSCRIPTION} anúncio na assinatura.
            Filial: +{formatPriceBRL(PRICING.EXTRA_AD_AMOUNT)}/mês — fale conosco.
          </p>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href="/painel/assinatura">Assinar para anunciar</Link>
          </Button>
        )}
      </div>

      {!isAdmin && freeCredits > 0 && (
        <div className="mb-2 rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp">
          Você tem {freeCredits} crédito(s) de destaque grátis (
          {PRICING.REFERRAL_PREMIUM_DAYS} dias cada). Use em &quot;Usar crédito&quot;.
        </div>
      )}

      {params.error && (
        <div className="mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {params.error}
        </div>
      )}

      {params.deleted === "1" && (
        <div className="mb-2 rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp">
          Anúncio excluído com sucesso.
        </div>
      )}

      {params.boosted === "1" && (
        <div className="mb-2 rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp">
          Destaque premium ativado com sucesso. Use &quot;Editar fotos&quot; para adicionar
          até 5 imagens na galeria.
        </div>
      )}

      {advertisements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Você ainda não tem anúncios publicados.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {advertisements.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
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
                  {ad.premiumActive && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/painel/anuncios/${ad.id}/editar`}>
                        <ImageIcon className="h-4 w-4" />
                        Editar fotos
                      </Link>
                    </Button>
                  )}
                  {!ad.premiumActive && subscriptionActive && (
                    <BoostAdvertisementForm
                      advertisementId={ad.id}
                      paidLabel={boostLabel}
                      freeCredits={freeCredits}
                      referralDays={PRICING.REFERRAL_PREMIUM_DAYS}
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
