import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, MessageCircle, KeyRound } from "lucide-react";
import {
  completeClaimPasswordAction,
  getClaimSessionProviderId,
  requestClaimOtpAction,
  startClaimWithTokenAction,
  verifyClaimOtpAction,
} from "@/actions/claim-actions";
import { getProviderByClaimToken } from "@/application/services/provider-claim-service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Reivindicar anúncio",
  description:
    "Confirme que você é o dono do anúncio criado no BuscaZapp e assuma a administração do perfil.",
};

interface PageProps {
  readonly searchParams: Promise<{
    readonly token?: string;
    readonly step?: string;
    readonly error?: string;
    readonly whatsapp?: string;
    readonly masked?: string;
    readonly delivery?: string;
  }>;
}

export default async function ClaimAdvertisementPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token?.trim();
  const step = params.step ?? (token ? "token" : "whatsapp");
  const claimSessionId = await getClaimSessionProviderId();

  const tokenProvider = token ? await getProviderByClaimToken(token) : null;

  let passwordProviderName: string | null = null;
  let passwordAds: { title: string; city: string | null }[] = [];
  if (step === "password" && claimSessionId) {
    const provider = await prisma.provider.findUnique({
      where: { id: claimSessionId },
      select: {
        name: true,
        advertisements: {
          where: { status: { not: "INACTIVE" } },
          select: { title: true, city: true },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    passwordProviderName = provider?.name ?? null;
    passwordAds = provider?.advertisements ?? [];
  }

  return (
    <>
      <PageHeader
        title="Reivindicar anúncio"
        description="Confirme a posse do perfil e defina sua senha para administrar o anúncio"
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
                  com {tokenProvider.advertisements.length} anúncio(s). Confirme
                  para definir sua senha e entrar no painel.
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
                <form action={startClaimWithTokenAction}>
                  <input type="hidden" name="token" value={token} />
                  <Button type="submit" variant="whatsapp" className="w-full">
                    Continuar e definir senha
                  </Button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este link é inválido ou expirou. Informe o WhatsApp do anúncio
                abaixo para receber um código.
              </p>
            )
          ) : null}

          {(step === "whatsapp" || (step === "token" && !tokenProvider)) && (
            <form action={requestClaimOtpAction} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Digite o WhatsApp usado no anúncio. Enviaremos um código de
                verificação para confirmar que você é o dono.
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
                Enviar código
              </Button>
              <p className="text-xs text-muted-foreground">
                Se você recebeu mensagem do BuscaZapp com o botão/link{" "}
                <strong>Reivindique o anúncio</strong>, use esse link — é mais
                rápido.
              </p>
            </form>
          )}

          {step === "otp" && (
            <form action={verifyClaimOtpAction} className="space-y-4">
              {params.delivery === "whatsapp" ? (
                <p className="rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
                  Enviamos um código de 6 dígitos para o WhatsApp{" "}
                  {params.masked ? params.masked : "informado"}.
                </p>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  Não foi possível enviar o código automaticamente por WhatsApp.
                  Use o link <strong>Reivindique o anúncio</strong> da mensagem
                  que o BuscaZapp enviou, ou peça ao suporte para reenviar.
                </p>
              )}
              <input type="hidden" name="whatsapp" value={params.whatsapp ?? ""} />
              <div>
                <label htmlFor="code" className="mb-1.5 block text-sm font-medium">
                  Código OTP
                </label>
                <Input
                  id="code"
                  name="code"
                  placeholder="000000"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
              <Button
                type="submit"
                variant="whatsapp"
                className="w-full"
                disabled={params.delivery !== "whatsapp"}
              >
                Validar código
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/reivindicar">Voltar</Link>
              </Button>
            </form>
          )}

          {step === "password" && (
            claimSessionId && passwordProviderName ? (
              <form action={completeClaimPasswordAction} className="space-y-4">
                <div className="rounded-lg bg-whatsapp/10 p-3 text-sm">
                  <p className="font-medium text-foreground">
                    Conta confirmada: {passwordProviderName}
                  </p>
                  {passwordAds.length > 0 ? (
                    <ul className="mt-2 space-y-0.5 text-muted-foreground">
                      {passwordAds.map((ad) => (
                        <li key={ad.title}>
                          · {ad.title}
                          {ad.city ? ` — ${ad.city}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  Defina uma senha para entrar no painel quando quiser. Você
                  poderá alterá-la depois em Meu perfil.
                </p>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                    Nova senha
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="passwordConfirm"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Confirmar senha
                  </label>
                  <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" variant="whatsapp" className="w-full">
                  <KeyRound className="h-4 w-4" />
                  Salvar senha e entrar no painel
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sessão expirada.{" "}
                <Link href="/reivindicar" className="text-whatsapp underline">
                  Recomece a reivindicação
                </Link>
                .
              </p>
            )
          )}
        </div>
      </section>
    </>
  );
}
