import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound, User } from "lucide-react";
import {
  updateProviderPasswordAction,
  updateProviderProfileAction,
} from "@/actions/provider-actions";
import { BRAZILIAN_STATES } from "@/config/brazilian-states";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import { getCurrentProvider } from "@/lib/provider-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Meu perfil",
};

interface ProfilePageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly passwordError?: string;
    readonly passwordSaved?: string;
  }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const params = await searchParams;

  return (
    <PanelLayout>
      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-whatsapp" />
            Meu perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          {params.saved === "1" && (
            <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
              Perfil atualizado com sucesso.
            </p>
          )}

          {params.error && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </p>
          )}

          <form action={updateProviderProfileAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                  Nome completo
                </label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={provider.name}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  E-mail
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={provider.email}
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
                  defaultValue={provider.whatsapp}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div>
                <label htmlFor="age" className="mb-1.5 block text-sm font-medium">
                  Idade
                </label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min={18}
                  max={120}
                  defaultValue={provider.age ?? ""}
                  placeholder="Ex.: 35"
                />
              </div>

              <div>
                <label htmlFor="state" className="mb-1.5 block text-sm font-medium">
                  Estado
                </label>
                <select
                  id="state"
                  name="state"
                  defaultValue={provider.state ?? ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione</option>
                  {BRAZILIAN_STATES.map((item) => (
                    <option key={item.uf} value={item.uf}>
                      {item.uf} — {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="city" className="mb-1.5 block text-sm font-medium">
                  Cidade
                </label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={provider.city ?? ""}
                  placeholder="Sua cidade"
                />
              </div>

              <div>
                <label htmlFor="neighborhood" className="mb-1.5 block text-sm font-medium">
                  Bairro
                </label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  defaultValue={provider.neighborhood ?? ""}
                  placeholder="Opcional"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="bio" className="mb-1.5 block text-sm font-medium">
                  Sobre você
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={provider.bio ?? ""}
                  placeholder="Conte um pouco sobre seu trabalho ou serviço (opcional)"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <Button type="submit" variant="whatsapp">
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-whatsapp" />
            Alterar senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          {params.passwordSaved === "1" && (
            <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
              Senha alterada com sucesso.
            </p>
          )}

          {params.passwordError && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {params.passwordError}
            </p>
          )}

          <form action={updateProviderPasswordAction} className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-1.5 block text-sm font-medium"
              >
                Senha atual
              </label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Nova senha
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  required
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
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="outline">
              Atualizar senha
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </PanelLayout>
  );
}
