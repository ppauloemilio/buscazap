import Link from "next/link";
import { Megaphone, Sparkles } from "lucide-react";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FreePanelOverviewProps {
  readonly advertisementCount: number;
  readonly firstAdId?: string;
  readonly firstAdPublicHref?: string;
}

export function FreePanelOverview({
  advertisementCount,
  firstAdId,
  firstAdPublicHref,
}: FreePanelOverviewProps) {
  const hasAd = advertisementCount > 0;

  return (
    <div className="space-y-3">
      <Card className="border-whatsapp/25 bg-whatsapp/5">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-whatsapp" />
            <div>
              <h2 className="font-semibold">
                {hasAd ? "Plano grátis — anúncio ativo" : "Comece sua listagem grátis"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasAd
                  ? "Você aparece na busca com nome, categoria, bairro e WhatsApp."
                  : "Publique em poucos passos: título, cidade, bairro, categoria e WhatsApp."}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {hasAd && firstAdId ? (
              <>
                <Button variant="whatsapp" size="sm" asChild>
                  <Link href={`/painel/anuncios/${firstAdId}/editar`}>
                    Editar anúncio
                  </Link>
                </Button>
                {firstAdPublicHref ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={firstAdPublicHref} target="_blank">
                      Ver na busca
                    </Link>
                  </Button>
                ) : null}
              </>
            ) : (
              <Button variant="whatsapp" size="sm" asChild>
                <Link href="/painel/anuncios/novo">Criar anúncio grátis</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-whatsapp" />
            Perfil completo
          </div>
          <p className="text-sm text-muted-foreground">
            A partir de {formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês: capa,
            logo, descrição, horário, produtos, serviços e selo verificado.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/painel/assinatura">Ver planos e fazer upgrade</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
