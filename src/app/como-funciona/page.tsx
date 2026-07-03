import type { Metadata } from "next";
import Link from "next/link";
import { Zap, Star, Shield, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Como funciona",
};

const STEPS = [
  {
    icon: Search,
    title: "1. Busque",
    description:
      "Pesquise por profissionais, empresas, produtos ou serviços na sua cidade.",
  },
  {
    icon: Star,
    title: "2. Compare",
    description:
      "Veja avaliações, categorias e informações de cada anúncio.",
  },
  {
    icon: Zap,
    title: "3. Contate",
    description:
      "Fale diretamente pelo WhatsApp, sem intermediários.",
  },
  {
    icon: Shield,
    title: "4. Confie",
    description:
      "Anúncios moderados e sistema de denúncias para sua segurança.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="Como funciona"
        description="Encontre e entre em contato em poucos passos"
      />
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-6">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="flex gap-4 rounded-xl border bg-card p-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-whatsapp/10">
                <step.icon className="h-6 w-6 text-whatsapp" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{step.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="whatsapp" asChild>
            <Link href="/buscar">Começar a buscar</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
