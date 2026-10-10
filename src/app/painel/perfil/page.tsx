import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Images, KeyRound, User } from "lucide-react";
import {
  updateProviderPasswordAction,
  updateProviderProfileAction,
} from "@/actions/provider-actions";
import { listProviderCompanyImages } from "@/application/services/provider-image-service";
import { listActiveCities, listActiveStates } from "@/application/services/catalog-service";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { ProviderCompanyImagesEditor } from "@/features/panel/components/provider-company-images-editor";
import { PanelLayout } from "@/features/panel/components/panel-layout";
import {
  canProviderUsePaidFeatures,
  getCurrentProvider,
} from "@/lib/provider-session";
import { isFreeListingProvider } from "@/lib/free-listing";
import Link from "next/link";
import { toLocalWhatsAppDigits } from "@/lib/whatsapp";
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
    readonly photosSaved?: string;
    readonly passwordError?: string;
    readonly passwordSaved?: string;
  }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const provider = await getCurrentProvider();
  if (!provider) redirect("/entrar");

  const params = await searchParams;
  const newProfile = isNewAdProfileEnabled();
  const paidActive = canProviderUsePaidFeatures(provider);
  const freeListing = isFreeListingProvider(provider);
  const [states, cities, companyImages] = await Promise.all([
    listActiveStates(),
    listActiveCities(),
    newProfile ? listProviderCompanyImages(provider.id) : Promise.resolve([]),
  ]);

  return (
    <PanelLayout>
      <div className="space-y-3">
        {freeListing && (
          <Card className="border-whatsapp/20 bg-whatsapp/5">
            <CardContent className="space-y-2 p-3 text-sm">
              <p>
                No plano grátis, título, cidade, bairro, categoria e WhatsApp
                ficam no seu anúncio.
              </p>
              <Button variant="whatsapp" size="sm" asChild>
                <Link href="/painel/anuncios">Editar anúncio</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!freeListing && (
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-whatsapp" />
              Meu perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {params.saved === "1" && (
              <p className="mb-2 rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
                Perfil atualizado com sucesso.
              </p>
            )}

            {params.error && (
              <p className="mb-2 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
                {params.error}
              </p>
            )}

            <form action={updateProviderProfileAction} className="space-y-2.5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="mb-1 block text-sm font-medium">
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
                  <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium">
                    WhatsApp (login)
                  </label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    defaultValue={toLocalWhatsAppDigits(provider.whatsapp)}
                    placeholder="91999999999"
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
                    defaultValue={provider.email ?? ""}
                    placeholder="Para recuperação de senha"
                  />
                </div>

                <div>
                  <label htmlFor="age" className="mb-1 block text-sm font-medium">
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
                  <label htmlFor="state" className="mb-1 block text-sm font-medium">
                    Estado
                  </label>
                  <select
                    id="state"
                    name="state"
                    defaultValue={provider.state ?? ""}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione</option>
                    {states.map((item) => (
                      <option key={item.id} value={item.uf}>
                        {item.uf} — {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="mb-1 block text-sm font-medium">
                    Cidade
                  </label>
                  <Input
                    id="city"
                    name="city"
                    list="profile-cities"
                    defaultValue={provider.city ?? ""}
                    placeholder="Sua cidade"
                  />
                  <datalist id="profile-cities">
                    {cities.map((city) => (
                      <option key={city.id} value={city.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="neighborhood" className="mb-1 block text-sm font-medium">
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
                  <label htmlFor="bio" className="mb-1 block text-sm font-medium">
                    Sobre você
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    defaultValue={provider.bio ?? ""}
                    placeholder="Conte um pouco sobre seu trabalho ou serviço (opcional)"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <Button type="submit" variant="whatsapp" size="sm">
                Salvar alterações
              </Button>
            </form>
          </CardContent>
        </Card>
        )}

        {newProfile && !freeListing && (
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Images className="h-4 w-4 text-whatsapp" />
                Fotos da empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {params.photosSaved === "1" && (
                <p className="mb-2 rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
                  Fotos da empresa atualizadas.
                </p>
              )}
              <ProviderCompanyImagesEditor
                images={companyImages}
                paidActive={paidActive}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-whatsapp" />
              {freeListing ? "Senha da conta" : "Alterar senha"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {params.passwordSaved === "1" && (
              <p className="mb-2 rounded-lg bg-whatsapp/10 p-2.5 text-sm text-whatsapp">
                Senha alterada com sucesso.
              </p>
            )}

            {params.passwordError && (
              <p className="mb-2 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
                {params.passwordError}
              </p>
            )}

            <form action={updateProviderPasswordAction} className="space-y-2.5">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="mb-1 block text-sm font-medium"
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

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-1 block text-sm font-medium"
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
                    className="mb-1 block text-sm font-medium"
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

              <Button type="submit" variant="outline" size="sm">
                Atualizar senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PanelLayout>
  );
}
