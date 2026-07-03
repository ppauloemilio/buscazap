import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, CheckCircle } from "lucide-react";
import { getCurrentProvider } from "@/lib/provider-session";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/config/pricing";

export const metadata: Metadata = {
  title: "Anunciar",
};

const BENEFITS = [
  "Assinatura mensal de R$ 10,00 via PIX",
  "Alcance clientes na sua cidade",
  "Contato direto via WhatsApp",
  "Destaque premium opcional por R$ 5,00/30 dias",
] as const;

export default async function AdvertisePage() {
  const provider = await getCurrentProvider();

  return (
    <>
      <PageHeader
        title="Anuncie no BuscaZap"
        description="Cadastre seus serviços e seja encontrado por milhares de consumidores"
      />
      <section className="container mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-xl border bg-card p-6 md:p-8">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp/10">
            <Megaphone className="h-7 w-7 text-whatsapp" />
          </div>

          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Planos para prestadores
          </h2>

          <ul className="mb-8 space-y-3">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="font-semibold">Assinatura</p>
              <p className="text-2xl font-bold text-whatsapp">
                R$ {PRICING.SUBSCRIPTION_AMOUNT.toFixed(2).replace(".", ",")}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold">Destaque premium</p>
              <p className="text-2xl font-bold text-whatsapp">
                R$ {PRICING.PREMIUM_BOOST_AMOUNT.toFixed(2).replace(".", ",")}
                <span className="text-sm font-normal text-muted-foreground">/30 dias</span>
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {provider ? (
              <Button variant="whatsapp" asChild>
                <Link href="/painel">Ir para o painel</Link>
              </Button>
            ) : (
              <>
                <Button variant="whatsapp" asChild>
                  <Link href="/cadastro">Criar conta de prestador</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/entrar">Já tenho conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
