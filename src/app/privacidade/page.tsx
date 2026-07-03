import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Política de privacidade",
};

const SECTIONS = [
  {
    title: "Dados coletados",
    content:
      "Coletamos informações fornecidas no cadastro, como nome, e-mail e dados dos anúncios. Dados sensíveis como CPF e CNPJ não são expostos publicamente.",
  },
  {
    title: "Uso dos dados",
    content:
      "Utilizamos seus dados para operar a plataforma, melhorar a experiência de busca e garantir a segurança dos usuários.",
  },
  {
    title: "Compartilhamento",
    content:
      "Não vendemos seus dados pessoais. Informações de contato em anúncios são exibidas conforme autorizado pelo prestador.",
  },
  {
    title: "Seus direitos",
    content:
      "Você pode solicitar acesso, correção ou exclusão dos seus dados entrando em contato pelo e-mail suporte@buscazap.com.br.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Política de privacidade"
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
