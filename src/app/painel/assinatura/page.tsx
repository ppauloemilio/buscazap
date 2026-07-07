import { redirect } from "next/navigation";
import { CreditCard, Crown, Megaphone } from "lucide-react";
import { createSubscriptionPaymentAction } from "@/actions/provider-actions";
import { getSubscriptionStatus } from "@/application/services/subscription-service";
import { getCurrentProvider } from "@/lib/provider-session";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRICING } from "@/config/pricing";

interface SubscriptionPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
  }>;
}

export default async function SubscriptionPage({
  searchParams,
}: SubscriptionPageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const params = await searchParams;
  const status = await getSubscriptionStatus(provider.id);

  return (
    <PanelLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-whatsapp" />
            Assinatura mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {params.error}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div>
              <p className="font-medium">Plano Anunciante</p>
              <p className="text-sm text-muted-foreground">
                R$ {PRICING.SUBSCRIPTION_AMOUNT.toFixed(2).replace(".", ",")}/mês
                via PIX
              </p>
            </div>
            <Badge variant={status.active ? "whatsapp" : "secondary"}>
              {status.active ? "Ativa" : "Inativa"}
            </Badge>
          </div>

          {status.expiresAt && (
            <p className="text-sm text-muted-foreground">
              {status.active ? "Válida até" : "Expirou em"}:{" "}
              {status.expiresAt.toLocaleDateString("pt-BR")}
            </p>
          )}

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-whatsapp" />
              Publique anúncios na plataforma
            </li>
            <li className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-whatsapp" />
              Destaque premium opcional por R${" "}
              {PRICING.PREMIUM_BOOST_AMOUNT.toFixed(2).replace(".", ",")}/anúncio
            </li>
          </ul>

          <form action={createSubscriptionPaymentAction}>
            <Button type="submit" variant="whatsapp">
              {status.active ? "Renovar assinatura" : "Assinar agora"}
            </Button>
          </form>

          {!status.active && (
            <p className="text-xs text-muted-foreground">
              Sem assinatura ativa você não pode publicar novos anúncios.
            </p>
          )}
        </CardContent>
      </Card>
    </PanelLayout>
  );
}
