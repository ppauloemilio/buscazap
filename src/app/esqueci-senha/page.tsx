import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { requestPasswordResetAction } from "@/actions/password-reset-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Esqueci minha senha",
};

interface ForgotPasswordPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly sent?: string;
    readonly message?: string;
  }>;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <>
      <PageHeader
        title="Esqueci minha senha"
        description="Informe seu WhatsApp ou e-mail para recuperar o acesso"
      />
      <section className="container mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp/10">
            <KeyRound className="h-6 w-6 text-whatsapp" />
          </div>

          {params.sent === "1" && (
            <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
              {params.message ??
                "Se a conta tiver e-mail, você receberá instruções em instantes."}
            </p>
          )}

          {params.error && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          )}

          {params.sent !== "1" && (
            <form action={requestPasswordResetAction} className="space-y-4">
              <div>
                <label htmlFor="login" className="mb-1.5 block text-sm font-medium">
                  WhatsApp ou e-mail
                </label>
                <Input
                  id="login"
                  name="login"
                  placeholder="91999999999 ou seu@email.com"
                  required
                  autoComplete="username"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Sem e-mail cadastrado? Peça ao administrador para redefinir sua senha.
                </p>
              </div>
              <Button type="submit" variant="whatsapp" className="w-full">
                Enviar link de redefinição
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/entrar" className="text-whatsapp hover:underline">
              Voltar para entrar
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
