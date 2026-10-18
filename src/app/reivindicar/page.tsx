import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, MessageCircle, Send, Clock } from "lucide-react";
import {
  confirmClaimSentAction,
  requestClaimAction,
  startClaimWithTokenAction,
} from "@/actions/claim-actions";
import { getProviderByClaimToken } from "@/application/services/provider-claim-service";
import {
  buildClaimInboundWhatsAppHref,
  formatBuscazappClaimWhatsAppDisplay,
} from "@/config/claim-whatsapp";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Reivindicar anúncio",
  description:
    "Confirme que você é o dono do anúncio criado no BuscaZapp e receba acesso ao painel.",
};

interface PageProps {
  readonly searchParams: Promise<{
    readonly token?: string;
    readonly step?: string;
    readonly error?: string;
    readonly whatsapp?: string;
    readonly code?: string;
    readonly name?: string;
  }>;
}

export default async function ClaimAdvertisementPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token?.trim();
  const step = params.step ?? (token ? "token" : "whatsapp");

  const tokenProvider = token ? await getProviderByClaimToken(token) : null;

  const codeMessage = params.code?.trim() ?? "";
  const codeDigits = codeMessage.replace(/^BZ-/i, "").replace(/\D/g, "");
  const supportDisplay = formatBuscazappClaimWhatsAppDisplay();
  const waHref =
    codeDigits.length === 6
      ? buildClaimInboundWhatsAppHref(codeDigits)
      : null;
  const providerName = params.name?.trim() ?? "";

  return (
    <>
      <PageHeader
        title="Reivindicar anúncio"
        description="Confirme a posse do perfil enviando uma mensagem ao BuscaZapp"
      />
      <section className="container mx-auto max-w-lg px-4 py-8">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp/10">
            <ShieldCheck className="h-6 w-6 text-whatsapp" />
          </div>

          {params.error ? (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}

          {step === "token" && token ? (
            tokenProvider ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Encontramos o perfil{" "}
                  <span className="font-medium text-foreground">
                    {tokenProvider.name}
                  </span>{" "}
                  com {tokenProvider.advertisements.length} anúncio(s).
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {tokenProvider.advertisements.map((ad) => (
                    <li key={ad.id}>
                      · {ad.title}
                      {ad.neighborhood ? ` — ${ad.neighborhood}` : ""}
                      {ad.city ? `, ${ad.city}` : ""}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  Para confirmar que você é o dono, vamos gerar um código curto
                  para você enviar ao WhatsApp do BuscaZapp. Depois liberamos
                  usuário e senha no seu WhatsApp.
                </p>
                <form action={startClaimWithTokenAction}>
                  <input type="hidden" name="token" value={token} />
                  <Button type="submit" variant="whatsapp" className="w-full">
                    Continuar
                  </Button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este link é inválido ou expirou. Informe o WhatsApp do anúncio
                abaixo.
              </p>
            )
          ) : null}

          {(step === "whatsapp" || (step === "token" && !tokenProvider)) && (
            <form action={requestClaimAction} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Digite o WhatsApp do anúncio. Você envia um código curto para o
                BuscaZapp; nossa equipe confere e te manda login e senha
                temporária no WhatsApp.
              </p>
              <div>
                <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-medium">
                  WhatsApp do anúncio
                </label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  placeholder="91999999999"
                  required
                  inputMode="tel"
                  defaultValue={params.whatsapp ?? ""}
                />
              </div>
              <Button type="submit" variant="whatsapp" className="w-full">
                <MessageCircle className="h-4 w-4" />
                Gerar código
              </Button>
            </form>
          )}

          {step === "send" && (
            <div className="space-y-4">
              {providerName ? (
                <p className="text-sm font-medium text-foreground">
                  Perfil: {providerName}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                Pelo <strong>mesmo WhatsApp do anúncio</strong>, envie a mensagem
                abaixo para o número do BuscaZapp
                {supportDisplay ? (
                  <>
                    {" "}
                    (
                    <span className="font-medium text-foreground">
                      {supportDisplay}
                    </span>
                    )
                  </>
                ) : null}
                .
              </p>

              <div className="rounded-lg border border-whatsapp/30 bg-whatsapp/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Mensagem a enviar
                </p>
                <p className="mt-1 font-mono text-2xl font-semibold tracking-widest text-foreground">
                  {codeMessage || "—"}
                </p>
              </div>

              {waHref ? (
                <Button variant="whatsapp" className="w-full" asChild>
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    <Send className="h-4 w-4" />
                    Abrir WhatsApp e enviar
                  </a>
                </Button>
              ) : null}

              <form action={confirmClaimSentAction} className="space-y-3">
                <input type="hidden" name="code" value={codeMessage} />
                <input type="hidden" name="name" value={providerName} />
                <Button type="submit" variant="default" className="w-full">
                  Já enviei — aguardar liberação
                </Button>
              </form>

              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/reivindicar">Voltar</Link>
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp/10">
                <Clock className="h-6 w-6 text-whatsapp" />
              </div>
              <p className="text-sm text-muted-foreground">
                Recebemos seu pedido
                {providerName ? (
                  <>
                    {" "}
                    para <strong>{providerName}</strong>
                  </>
                ) : null}
                {codeMessage ? (
                  <>
                    {" "}
                    (código <strong className="font-mono">{codeMessage}</strong>)
                  </>
                ) : null}
                .
              </p>
              <p className="text-sm text-muted-foreground">
                Nossa equipe confere a mensagem no WhatsApp do BuscaZapp e, se
                estiver tudo certo, envia <strong>usuário e senha temporária</strong>{" "}
                para o WhatsApp do anúncio. Depois é só entrar em{" "}
                <Link href="/entrar" className="text-whatsapp underline">
                  /entrar
                </Link>
                .
              </p>
              <Button variant="whatsapp" className="w-full" asChild>
                <Link href="/entrar">Ir para o login</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
