import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, MessageCircle, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Central de ajuda",
};

const FAQ_ITEMS = [
  {
    question: "Como busco um profissional?",
    answer:
      "Use a barra de busca na página inicial. Informe o que procura e, se quiser, filtre por cidade e tipo de anúncio.",
  },
  {
    question: "O BuscaZap cobra pelo contato?",
    answer:
      "Não. O contato é feito diretamente pelo WhatsApp, sem taxas da plataforma.",
  },
  {
    question: "Como anuncio meu serviço?",
    answer:
      "Acesse a página Anunciar e crie sua conta de prestador para cadastrar seus anúncios.",
  },
  {
    question: "Como denuncio um anúncio?",
    answer:
      "Acesse a página de denúncia e informe o link ou ID do anúncio com o motivo da reclamação.",
  },
] as const;

export default function HelpPage() {
  return (
    <>
      <PageHeader
        title="Central de ajuda"
        description="Respostas para as dúvidas mais comuns"
      />
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/como-funciona"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-whatsapp/50"
          >
            <HelpCircle className="h-5 w-5 text-whatsapp" />
            <span className="text-sm font-medium">Como funciona</span>
          </Link>
          <Link
            href="/denunciar"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-whatsapp/50"
          >
            <ShieldAlert className="h-5 w-5 text-whatsapp" />
            <span className="text-sm font-medium">Denunciar anúncio</span>
          </Link>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border bg-card p-5"
            >
              <summary className="cursor-pointer font-medium text-foreground">
                {item.question}
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-xl border bg-muted/30 p-6 text-center">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-whatsapp" />
          <p className="text-sm text-muted-foreground">
            Não encontrou o que precisa? Entre em contato pelo e-mail{" "}
            <a
              href="mailto:suporte@buscazap.com.br"
              className="font-medium text-whatsapp hover:underline"
            >
              suporte@buscazap.com.br
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
