import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Quem somos",
  description:
    "O BuscaZapp é um guia local para encontrar empresas, profissionais e serviços da sua cidade. Contato direto pelo WhatsApp.",
};

const PARAGRAPHS = [
  "O BuscaZapp é um guia local criado para aproximar pessoas de empresas, profissionais e serviços da sua cidade.",
  "Aqui você encontra produtos, serviços e negócios locais e entra em contato diretamente pelo WhatsApp — rápido, simples e sem intermediários.",
  "Nosso objetivo é ajudar quem precisa de um serviço a encontrar quem pode resolver, e dar aos empreendedores uma forma acessível de divulgar o negócio e conquistar novos clientes.",
  "Somos uma vitrine de contato: a conversa e a negociação acontecem entre você e o anunciante. Anúncios passam por moderação e há canal de denúncias para manter a plataforma confiável.",
  "Começamos pela região metropolitana de Belém e estamos expandindo para mais cidades.",
  "Valorizamos os negócios locais e acreditamos que, quando consumidores e empreendedores se conectam, toda a comunidade cresce.",
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="Quem somos"
        description="Encontre local, fale direto e resolva rápido"
      />
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-4">
          {PARAGRAPHS.map((paragraph) => (
            <p
              key={paragraph}
              className="text-sm leading-relaxed text-muted-foreground md:text-base"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <p className="mt-8 text-center text-base font-semibold text-foreground">
          BuscaZapp — encontre local, fale direto e resolva rápido.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="whatsapp" asChild>
            <Link href="/buscar">Começar a buscar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/anunciar">Anunciar meu negócio</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
