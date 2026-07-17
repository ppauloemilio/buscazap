import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { registerProviderAction } from "@/actions/provider-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRICING } from "@/config/pricing";

export const metadata: Metadata = {
  title: "Cadastro de anunciante",
};

interface RegisterPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly ref?: string;
  }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <>
      <PageHeader
        compact
        title="Criar conta de anunciante"
        description={`Cadastre-se com ${PRICING.LAUNCH_TRIAL_DAYS} dias grátis para publicar em Belém e Ananindeua`}
      />
      <section className="container mx-auto max-w-md px-4 py-5">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp/10">
            <UserPlus className="h-5 w-5 text-whatsapp" />
          </div>

          {params.error && (
            <p className="mb-3 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {params.error}
            </p>
          )}

          <form action={registerProviderAction} className="space-y-2.5">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Nome completo
              </label>
              <Input id="name" name="name" placeholder="Seu nome" required />
            </div>
            <div>
              <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium">
                WhatsApp
              </label>
              <Input
                id="whatsapp"
                name="whatsapp"
                placeholder="91999999999"
                required
                autoComplete="tel"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Seu WhatsApp será o login da conta
              </p>
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
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
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                E-mail{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Para pagar PIX e recuperar senha"
              />
            </div>
            <div>
              <label
                htmlFor="referralCode"
                className="mb-1 block text-sm font-medium"
              >
                Código de indicação (opcional)
              </label>
              <Input
                id="referralCode"
                name="referralCode"
                placeholder="Ex.: A1B2C3D4"
                defaultValue={params.ref ?? ""}
              />
            </div>
            <Button type="submit" variant="whatsapp" className="mt-1 w-full">
              Criar conta
            </Button>
          </form>

          <p className="mt-3 text-center text-xs text-muted-foreground">
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
