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
  "1º mês grátis para anunciar (depois R$ 10/mês via PIX)",
  "Por enquanto, disponível em Belém e Ananindeua",
  "Contato direto via WhatsApp",
  "Destaque premium: R$ 5,00/30 dias (ou 15 dias via indicação)",
] as const;

export default async function AdvertisePage() {
  const provider = await getCurrentProvider();

  return (
    <>
      <PageHeader
        compact
        title="Anuncie no BuscaZapp"
        description="Cadastre-se em Belém ou Ananindeua e seja encontrado no WhatsApp"
      />
      <section className="container mx-auto max-w-2xl px-4 py-5">
        <div className="rounded-xl border bg-card p-4 md:p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp/10">
            <Megaphone className="h-5 w-5 text-whatsapp" />
          </div>

          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Planos para anunciantes
          </h2>

          <ul className="mb-4 space-y-1.5">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Assinatura</p>
              <p className="text-xl font-bold text-whatsapp">
                R$ {PRICING.SUBSCRIPTION_AMOUNT.toFixed(2).replace(".", ",")}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Destaque premium</p>
              <p className="text-xl font-bold text-whatsapp">
                R$ {PRICING.PREMIUM_BOOST_AMOUNT.toFixed(2).replace(".", ",")}
                <span className="text-sm font-normal text-muted-foreground">/30 dias</span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {provider ? (
              <Button variant="whatsapp" asChild>
                <Link href="/painel">Ir para o painel</Link>
              </Button>
            ) : (
              <>
                <Button variant="whatsapp" asChild>
                  <Link href="/parceiro">Pré-cadastro rápido</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/cadastro">Criar conta completa</Link>
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
