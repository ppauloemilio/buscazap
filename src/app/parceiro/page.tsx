import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle,
  MapPin,
  MessageCircle,
  Rocket,
  Sparkles,
} from "lucide-react";
import { submitProviderLeadAction } from "@/actions/provider-lead-actions";
import { DescriptionEditor } from "@/components/advertisement/description-editor";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ServiceAreaField } from "@/features/panel/components/service-area-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import { PILOT_CITIES, PRICING } from "@/config/pricing";
import { ServiceArea } from "@/domain/enums";

export const metadata: Metadata = {
  title: "Pré-lançamento para anunciantes",
  description:
    "O BuscaZapp está chegando a Belém e Ananindeua. Cadastre seu WhatsApp de graça e garanta sua vaga entre os primeiros antes do lançamento para os clientes.",
};

interface PartnerPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly sent?: string;
  }>;
}

const ACCEPT = ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes.join(",");

const BENEFITS = [
  {
    icon: Rocket,
    title: "Saia na frente",
    text: "Garanta sua vaga entre os primeiros da região antes da abertura para clientes.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp direto",
    text: "O cliente te encontra e fala com você no WhatsApp — sem app extra.",
  },
  {
    icon: Sparkles,
    title: "Pré-cadastro grátis",
    text: `Sem senha agora. O 1º mês é cortesia (depois R$ ${PRICING.SUBSCRIPTION_AMOUNT.toFixed(2).replace(".", ",")}/mês).`,
  },
] as const;

export default async function PartnerLeadPage({ searchParams }: PartnerPageProps) {
  const params = await searchParams;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(150_25%_97%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsla(142,70%,40%,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_hsla(142,40%,70%,0.12),_transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-whatsapp/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-40 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl"
      />

      {/* Hero */}
      <section className="relative px-4 pb-10 pt-10 md:pb-14 md:pt-14">
        <div className="container mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <BrandLogo iconSize={48} textClassName="text-2xl md:text-3xl" linked={false} />
          </div>

          <p className="mt-4 animate-in fade-in slide-in-from-bottom-2 text-xs font-semibold uppercase tracking-[0.18em] text-whatsapp duration-700 [animation-delay:80ms] [animation-fill-mode:both]">
            Pré-lançamento · Belém e Ananindeua
          </p>

          <h1 className="mt-3 max-w-xl animate-in fade-in slide-in-from-bottom-3 text-3xl font-bold tracking-tight text-foreground duration-700 [animation-delay:140ms] [animation-fill-mode:both] md:text-4xl">
            O BuscaZapp está chegando.
            <span className="mt-1 block text-whatsapp">
              Cadastre seu WhatsApp hoje.
            </span>
          </h1>

          <p className="mt-4 max-w-lg animate-in fade-in slide-in-from-bottom-3 text-base text-muted-foreground duration-700 [animation-delay:200ms] [animation-fill-mode:both] md:text-lg">
            Garanta sua vaga entre os primeiros da região — de graça — antes do
            lançamento oficial para os clientes.
          </p>

          {params.sent !== "1" && (
            <div className="mt-7 animate-in fade-in zoom-in-95 duration-700 [animation-delay:280ms] [animation-fill-mode:both]">
              <Button variant="whatsapp" size="lg" className="px-8 text-base" asChild>
                <a href="#cadastro">Garantir minha vaga</a>
              </Button>
              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-whatsapp" />
                Só pedimos o essencial · sem senha agora
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="relative px-4 pb-10">
        <div className="container mx-auto max-w-2xl">
          <ul className="grid gap-5 sm:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit.title} className="text-center sm:text-left">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-whatsapp/10 sm:mx-0">
                  <benefit.icon className="h-4 w-4 text-whatsapp" />
                </div>
                <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {benefit.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Form */}
      <section id="cadastro" className="relative scroll-mt-6 px-4 pb-14">
        <div className="container mx-auto max-w-xl">
          <div className="rounded-2xl border border-whatsapp/15 bg-card/95 p-4 shadow-sm backdrop-blur-sm md:p-6">
            <div className="mb-4 text-center sm:text-left">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Pré-cadastro de anunciante
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Preencha abaixo. Em breve falamos no WhatsApp para publicar seu
                anúncio.
              </p>
            </div>

            {params.sent === "1" && (
              <div className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
                <p className="flex items-start gap-2 font-medium">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Vaga reservada! Recebemos seus dados.
                </p>
                <p className="mt-1 pl-6 text-whatsapp/90">
                  Em breve falamos com você no WhatsApp para finalizar e
                  publicar.
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
                  <Input
                    id="name"
                    name="name"
                    required
                    minLength={3}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium">
                    WhatsApp
                  </label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    required
                    placeholder="91999999999"
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
                  <label
                    htmlFor="neighborhood"
                    className="mb-1 block text-sm font-medium"
                  >
                    Bairro{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    minLength={2}
                    placeholder="Ex.: Nazaré — ou deixe vazio se for delivery"
                  />
                </div>
                </div>

                <ServiceAreaField
                  showHint={false}
                  defaultValue={ServiceArea.CITY_WIDE}
                />

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

                <div className="rounded-lg border border-dashed border-whatsapp/30 bg-whatsapp/5 p-3">
                  <label
                    htmlFor="description"
                    className="mb-1 block text-sm font-medium"
                  >
                    Descrição do anúncio
                  </label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Use Negrito, Itálico e Lista abaixo para formatar o texto.
                  </p>
                  <DescriptionEditor
                    required
                    minLength={20}
                    rows={7}
                    placeholder="Conte o que você oferece, horários, o que inclui..."
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
                  Garantir minha vaga grátis
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Ao enviar, você concorda com nossos{" "}
                  <Link href="/termos" className="underline hover:text-foreground">
                    Termos
                  </Link>{" "}
                  e{" "}
                  <Link
                    href="/privacidade"
                    className="underline hover:text-foreground"
                  >
                    Privacidade
                  </Link>
                  . Publicamos seu anúncio após confirmarmos no WhatsApp.
                </p>
              </form>
            )}

            {params.sent === "1" && (
              <p className="text-center text-xs text-muted-foreground">
                Pode fechar esta página. Entraremos em contato pelo WhatsApp.
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            BuscaZapp · WhatsApp da sua região, sem complicação
          </p>
        </div>
      </section>
    </div>
  );
}
