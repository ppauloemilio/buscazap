import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import { loginAdminAction } from "@/actions/admin-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Admin — Entrar",
};

interface AdminLoginPageProps {
  readonly searchParams: Promise<{ readonly error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <>
      <PageHeader
        title="Administração BuscaZapp"
        description="Acesso restrito a administradores"
      />
      <section className="container mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-6 w-6 text-destructive" />
          </div>

          {params.error && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          )}

          <form action={loginAdminAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                E-mail
              </label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Entrar no admin
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
