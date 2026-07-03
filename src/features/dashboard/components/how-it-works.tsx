import Link from "next/link";
import { Megaphone, Shield, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Zap,
    title: "Contato instantâneo",
    description: "Fale direto pelo WhatsApp sem intermediários.",
  },
  {
    icon: Star,
    title: "Avaliações reais",
    description: "Veja notas e comentários de outros consumidores.",
  },
  {
    icon: Shield,
    title: "Anúncios verificados",
    description: "Moderação ativa para garantir qualidade e segurança.",
  },
  {
    icon: Megaphone,
    title: "Anuncie grátis",
    description: "Cadastre seus serviços e alcance novos clientes.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Como funciona o BuscaZap
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Simples, rápido e direto no WhatsApp
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center rounded-xl border bg-card p-6 text-center"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp/10">
                <feature.icon className="h-6 w-6 text-whatsapp" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="whatsapp" size="lg" asChild>
            <Link href="/anunciar">
              <Megaphone className="h-4 w-4" />
              Comece a anunciar gratuitamente
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
