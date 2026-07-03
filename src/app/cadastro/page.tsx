import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { registerProviderAction } from "@/actions/provider-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Cadastro de prestador",
};

interface RegisterPageProps {
  readonly searchParams: Promise<{ readonly error?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <>
      <PageHeader
        title="Criar conta de prestador"
        description="Cadastre-se para publicar seus anúncios no BuscaZap"
      />
      <section className="container mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp/10">
            <UserPlus className="h-6 w-6 text-whatsapp" />
          </div>

          {params.error && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          )}

          <form action={registerProviderAction} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Nome completo
              </label>
              <Input id="name" name="name" placeholder="Seu nome" required />
            </div>
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
              <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-medium">
                WhatsApp
              </label>
              <Input
                id="whatsapp"
                name="whatsapp"
                placeholder="(11) 99999-9999"
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
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <Button type="submit" variant="whatsapp" className="w-full">
              Criar conta
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/entrar" className="text-whatsapp hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
