import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { resetPasswordAction } from "@/actions/password-reset-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Redefinir senha",
};

interface ResetPasswordPageProps {
  readonly searchParams: Promise<{
    readonly token?: string;
    readonly error?: string;
  }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  if (!params.token) {
    redirect("/esqueci-senha");
  }

  return (
    <>
      <PageHeader
        title="Redefinir senha"
        description="Escolha uma nova senha para sua conta"
      />
      <section className="container mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp/10">
            <LockKeyhole className="h-6 w-6 text-whatsapp" />
          </div>

          {params.error && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          )}

          <form action={resetPasswordAction} className="space-y-4">
            <input type="hidden" name="token" value={params.token} />
            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium">
                Nova senha
              </label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium"
              >
                Confirmar nova senha
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" variant="whatsapp" className="w-full">
              Salvar nova senha
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/esqueci-senha" className="text-whatsapp hover:underline">
              Solicitar novo link
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
