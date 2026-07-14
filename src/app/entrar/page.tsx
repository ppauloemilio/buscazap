import type { Metadata } from "next";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { loginProviderAction } from "@/actions/provider-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Entrar",
};

interface LoginPageProps {
  readonly searchParams: Promise<{ readonly error?: string; readonly reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <>
      <PageHeader
        compact
        title="Entrar"
        description="Acesse sua conta no BuscaZap"
      />
      <section className="container mx-auto max-w-md px-4 py-5">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp/10">
            <LogIn className="h-5 w-5 text-whatsapp" />
          </div>

          {params.reset === "1" && (
            <p className="mb-3 rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
              Senha redefinida com sucesso. Faça login com sua nova senha.
            </p>
          )}

          {params.error && (
            <p className="mb-3 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {params.error}
            </p>
          )}

          <form action={loginProviderAction} className="space-y-2.5">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                E-mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="text-xs text-whatsapp hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" variant="whatsapp" className="mt-1 w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-whatsapp hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
