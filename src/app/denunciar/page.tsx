import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Denunciar anúncio",
};

export default function ReportPage() {
  return (
    <>
      <PageHeader
        title="Denunciar anúncio"
        description="Ajude-nos a manter a plataforma segura e confiável"
      />
      <section className="container mx-auto max-w-xl px-4 py-10">
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>

          <form className="space-y-4">
            <div>
              <label htmlFor="ad-id" className="mb-1.5 block text-sm font-medium">
                ID ou link do anúncio
              </label>
              <Input
                id="ad-id"
                placeholder="Ex: adv-001 ou /anuncio/adv-001"
              />
            </div>
            <div>
              <label htmlFor="reason" className="mb-1.5 block text-sm font-medium">
                Motivo da denúncia
              </label>
              <Input
                id="reason"
                placeholder="Ex: Anúncio falso, conteúdo abusivo..."
              />
            </div>
            <div>
              <label htmlFor="details" className="mb-1.5 block text-sm font-medium">
                Detalhes adicionais
              </label>
              <textarea
                id="details"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Descreva o que aconteceu..."
              />
            </div>
            <Button type="submit" className="w-full">
              Enviar denúncia
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Você também pode voltar para a{" "}
            <Link href="/ajuda" className="text-whatsapp hover:underline">
              central de ajuda
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
