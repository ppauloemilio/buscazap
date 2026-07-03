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
  readonly searchParams: Promise<{ readonly error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <>
      <PageHeader title="Entrar" description="Acesse sua conta no BuscaZap" />
      <section className="container mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp/10">
            <LogIn className="h-6 w-6 text-whatsapp" />
          </div>

          {params.error && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          )}

          <form action={loginProviderAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
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
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" variant="whatsapp" className="w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Demo: demo@buscazap.com.br / 123456
          </p>

          <p className="mt-2 text-center text-xs text-muted-foreground">
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
