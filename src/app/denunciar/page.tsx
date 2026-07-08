import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { submitReportAction } from "@/actions/admin-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Denunciar anúncio",
};

interface ReportPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly sent?: string;
  }>;
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const params = await searchParams;

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

          {params.sent === "1" && (
            <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
              Denúncia enviada. Nossa equipe irá analisar.
            </p>
          )}

          {params.error && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          )}

          <form action={submitReportAction} className="space-y-4">
            <div>
              <label htmlFor="advertisementRef" className="mb-1.5 block text-sm font-medium">
                ID ou link do anúncio
              </label>
              <Input
                id="advertisementRef"
                name="advertisementRef"
                placeholder="Ex: clxyz... ou /anuncio/clxyz..."
                required
              />
            </div>
            <div>
              <label htmlFor="reason" className="mb-1.5 block text-sm font-medium">
                Motivo da denúncia
              </label>
              <Input
                id="reason"
                name="reason"
                placeholder="Ex: Anúncio falso, conteúdo abusivo..."
                required
              />
            </div>
            <div>
              <label htmlFor="details" className="mb-1.5 block text-sm font-medium">
                Detalhes adicionais
              </label>
              <textarea
                id="details"
                name="details"
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
