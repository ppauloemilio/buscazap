import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Handshake } from "lucide-react";
import { submitProviderLeadAction } from "@/actions/provider-lead-actions";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceAreaField } from "@/features/panel/components/service-area-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import { PILOT_CITIES, PRICING } from "@/config/pricing";

export const metadata: Metadata = {
  title: "Quero anunciar",
  description:
    "Pré-cadastro gratuito para anunciantes em Belém e Ananindeua. Deixe seus dados e falamos no WhatsApp.",
};

interface PartnerPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly sent?: string;
  }>;
}

const ACCEPT = ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes.join(",");

export default async function PartnerLeadPage({ searchParams }: PartnerPageProps) {
  const params = await searchParams;

  return (
    <>
      <PageHeader
        compact
        title="Quero anunciar no BuscaZap"
        description="Pré-cadastro rápido. Sem senha agora — nós entramos em contato no WhatsApp."
      />
      <section className="container mx-auto max-w-xl px-4 py-5">
        <div className="rounded-xl border bg-card p-4 md:p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp/10">
            <Handshake className="h-5 w-5 text-whatsapp" />
          </div>

          <p className="mb-4 text-sm text-muted-foreground">
            Estamos em piloto em Belém e Ananindeua. Preencha os dados abaixo e,
            em breve, publicamos seu anúncio. O 1º mês é grátis (depois R${" "}
            {PRICING.SUBSCRIPTION_AMOUNT.toFixed(2).replace(".", ",")}/mês).
          </p>

          {params.sent === "1" && (
            <div className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
              <p className="flex items-start gap-2 font-medium">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Recebemos seus dados!
              </p>
              <p className="mt-1 pl-6 text-whatsapp/90">
                Em breve falamos com você no WhatsApp para finalizar o cadastro.
              </p>
            </div>
          )}

          {params.error && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          )}

          {params.sent !== "1" && (
            <form
              action={submitProviderLeadAction}
              encType="multipart/form-data"
              className="space-y-3"
            >
              <input type="hidden" name="state" value="PA" />

              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium">
                  Seu nome
                </label>
                <Input id="name" name="name" required minLength={3} placeholder="Nome completo" />
              </div>

              <div>
                <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium">
                  WhatsApp
                </label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  required
                  placeholder="(91) 99999-9999"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className="mb-1 block text-sm font-medium">
                    Cidade
                  </label>
                  <select
                    id="city"
                    name="city"
                    required
                    defaultValue={PILOT_CITIES[0].name}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {PILOT_CITIES.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="neighborhood" className="mb-1 block text-sm font-medium">
                    Bairro
                  </label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    required
                    minLength={2}
                    placeholder="Ex.: Nazaré, Marco..."
                  />
                </div>
              </div>

              <ServiceAreaField showHint={false} />

              <div>
                <label htmlFor="adTitle" className="mb-1 block text-sm font-medium">
                  Nome do anúncio
                </label>
                <Input
                  id="adTitle"
                  name="adTitle"
                  required
                  minLength={5}
                  maxLength={80}
                  placeholder="Ex.: Gás e água no Guamá"
                />
              </div>

              <div>
                <label htmlFor="photo" className="mb-1 block text-sm font-medium">
                  Foto do anúncio
                </label>
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept={ACCEPT}
                  required
                  className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  JPG, PNG ou WebP · máx. 5 MB
                </p>
              </div>

              <Button type="submit" variant="whatsapp" className="w-full">
                Enviar pré-cadastro
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ao enviar, você concorda com nossos{" "}
                <Link href="/termos" className="underline hover:text-foreground">
                  Termos
                </Link>{" "}
                e{" "}
                <Link href="/privacidade" className="underline hover:text-foreground">
                  Privacidade
                </Link>
                . Seu anúncio ainda não aparece na busca até confirmarmos.
              </p>
            </form>
          )}

          {params.sent === "1" && (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">Voltar para a home</Link>
            </Button>
          )}
        </div>
      </section>
    </>
  );
}
