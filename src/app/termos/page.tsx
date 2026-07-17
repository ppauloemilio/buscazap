import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Termos de uso",
};

const SECTIONS = [
  {
    title: "1. Aceitação dos termos",
    content:
      "Ao utilizar o BuscaZapp, você concorda com estes termos de uso e com nossa política de privacidade.",
  },
  {
    title: "2. Uso da plataforma",
    content:
      "O BuscaZapp é uma plataforma de intermediação de contatos. Não nos responsabilizamos pelas negociações realizadas entre consumidores e anunciantes.",
  },
  {
    title: "3. Anúncios",
    content:
      "Anunciantes são responsáveis pelo conteúdo de seus anúncios. Reservamo-nos o direito de moderar, rejeitar ou remover anúncios que violem nossas políticas.",
  },
  {
    title: "4. Conduta do usuário",
    content:
      "É proibido publicar conteúdo falso, abusivo, discriminatório ou que viole a legislação vigente.",
  },
] as const;

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Termos de uso"
        description={`Última atualização: ${new Date().toLocaleDateString("pt-BR")}`}
      />
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="mb-2 font-semibold text-foreground">{section.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
