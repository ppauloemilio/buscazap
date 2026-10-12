import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Gift, Megaphone, Sparkles, Tag } from "lucide-react";
import { getHomepageSettings } from "@/application/services/homepage-settings-service";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import {
  BASIC_PLAN_BENEFITS,
  FREE_PLAN_BENEFITS,
  FREE_PLAN_TAGLINE,
  PRO_PLAN_EXTRA_BENEFITS,
} from "@/config/plan-marketing";
import { formatPriceBRL, PRICING } from "@/config/pricing";
import { getCurrentProvider } from "@/lib/provider-session";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Anunciar",
};

export default async function AdvertisePage() {
  const provider = await getCurrentProvider();
  const freemium = isNewAdProfileEnabled();
  const homepage = await getHomepageSettings();
  const plusOffer = homepage.plusPlanEnabled;

  const accountActions = provider ? (
    <Button variant="whatsapp" asChild>
      <Link href="/painel">Ir para o painel</Link>
    </Button>
  ) : (
    <>
      <Button variant="whatsapp" asChild>
        <Link href="/cadastro">Criar conta grátis</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/entrar">Já tenho conta</Link>
      </Button>
    </>
  );

  if (!freemium) {
    return (
      <>
        <PageHeader
          compact
          title="Anuncie no BuscaZapp"
          description="Cadastre-se na sua cidade e seja encontrado no WhatsApp"
        />
        <section className="container mx-auto max-w-2xl px-4 py-5">
          <div className="rounded-xl border bg-card p-4 md:p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp/10">
              <Megaphone className="h-5 w-5 text-whatsapp" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">Planos para anunciantes</h2>
            <ul className="mb-4 space-y-1.5">
              {[
                `Assinatura ${formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}/mês via PIX para publicar`,
                "Disponível nas cidades ativas do catálogo (todo o Brasil)",
                "Contato direto via WhatsApp",
                `Destaque premium: ${formatPriceBRL(PRICING.PREMIUM_BOOST_AMOUNT)}/30 dias`,
              ].map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">{accountActions}</div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        compact
        title="Anuncie no BuscaZapp"
        description="Comece grátis ou assine para um perfil completo — e seja encontrado no WhatsApp"
      />
      <section className="container mx-auto max-w-4xl px-4 py-5">
        <div className="mb-4 text-center sm:text-left">
          <h2 className="text-lg font-semibold text-foreground">
            Escolha como anunciar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Todos os planos usam a mesma conta. No painel você evolui do grátis para
            o pago quando quiser.
          </p>
        </div>

        <div
          className={cn(
            "grid gap-3",
            plusOffer ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"
          )}
        >
          <article className="flex flex-col rounded-xl border bg-card p-4 md:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Gift className="h-5 w-5 text-foreground" />
              </div>
              <Badge variant="secondary">Grátis</Badge>
            </div>
            <h3 className="text-base font-semibold">Plano Grátis</h3>
            <p className="mt-1 text-2xl font-bold">
              R$ 0
              <span className="text-sm font-normal text-muted-foreground">
                /sempre
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {FREE_PLAN_TAGLINE}
            </p>
            <ul className="mt-4 flex-1 space-y-1.5">
              {FREE_PLAN_BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {provider ? (
                <Button variant="outline" asChild>
                  <Link href="/painel/anuncios/novo">Criar anúncio no Plano Grátis</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/cadastro">Começar Grátis</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/entrar">Já tenho conta</Link>
                  </Button>
                </>
              )}
            </div>
          </article>

          <article
            className={cn(
              "flex flex-col rounded-xl border-2 border-whatsapp/50 bg-card p-4 shadow-sm md:p-5",
              "ring-1 ring-whatsapp/20"
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp/10">
                <Sparkles className="h-5 w-5 text-whatsapp" />
              </div>
              <Badge variant="whatsapp">Recomendado</Badge>
            </div>
            <h3 className="text-base font-semibold">Plano Básico</h3>
            <p className="mt-1 text-2xl font-bold text-whatsapp">
              {formatPriceBRL(PRICING.SUBSCRIPTION_AMOUNT)}
              <span className="text-sm font-normal text-muted-foreground">
                /mês
              </span>
            </p>
            <ul className="mt-4 flex-1 space-y-1.5">
              {BASIC_PLAN_BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {provider ? (
                <Button variant="whatsapp" asChild>
                  <Link href="/painel/assinatura">Assinar Plano Básico</Link>
                </Button>
              ) : (
                <>
                  <Button variant="whatsapp" asChild>
                    <Link href="/cadastro">Criar conta e Assinar</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/entrar">Já tenho conta</Link>
                  </Button>
                </>
              )}
            </div>
          </article>

          {plusOffer && (
            <article
              className={cn(
                "flex flex-col rounded-xl border border-whatsapp/30 bg-card p-4 md:p-5",
                "ring-1 ring-whatsapp/15"
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp/10">
                  <Tag className="h-5 w-5 text-whatsapp" />
                </div>
                <Badge variant="outline" className="border-whatsapp/40 text-whatsapp">
                  Pro
                </Badge>
              </div>
              <h3 className="text-base font-semibold">Plano Pro</h3>
              <p className="mt-1 text-2xl font-bold text-whatsapp">
                {formatPriceBRL(PRICING.SUBSCRIPTION_PLUS_AMOUNT)}
                <span className="text-sm font-normal text-muted-foreground">
                  /mês
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-1.5">
                {PRO_PLAN_EXTRA_BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {provider ? (
                  <Button variant="whatsapp" asChild>
                    <Link href="/painel/assinatura">Assinar Plano Pro</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="whatsapp" asChild>
                      <Link href="/cadastro">Criar conta e Assinar</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/entrar">Já tenho conta</Link>
                    </Button>
                  </>
                )}
              </div>
            </article>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Já é anunciante grátis?{" "}
          <Link
            href={provider ? "/painel/assinatura" : "/entrar"}
            className="font-medium text-whatsapp hover:underline"
          >
            Faça upgrade na área logada
          </Link>
          .
        </p>
      </section>
    </>
  );
}
