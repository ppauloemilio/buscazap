import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { adminCreateQuickFreeListingAction } from "@/actions/admin-actions";
import {
  getCategoriesWithCounts,
  listNeighborhoodsByCityForSearch,
  listActiveCities,
  listActiveStates,
} from "@/application/services/catalog-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdvertisementCategoryFields } from "@/features/panel/components/advertisement-category-fields";
import { getCurrentAdmin } from "@/lib/admin-session";
import { getDefaultCatalogLocation } from "@/shared/utils/catalog-location";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isNewAdProfileEnabled } from "@/config/feature-flags";

interface PageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly created?: string;
    readonly adId?: string;
    readonly notify?: string;
  }>;
}

export default async function AdminQuickFreeListingPage({
  searchParams,
}: PageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const [categories, neighborhoodsByCity, cities, states] = await Promise.all([
    getCategoriesWithCounts(),
    listNeighborhoodsByCityForSearch(),
    listActiveCities(),
    listActiveStates(),
  ]);

  const defaultLocation = getDefaultCatalogLocation(
    cities.map((c) => ({ name: c.name, state: c.state.uf })),
    states.map((s) => ({ uf: s.uf }))
  );
  const neighborhoods =
    neighborhoodsByCity.find(
      (row) =>
        row.city.localeCompare(defaultLocation.city, "pt-BR", {
          sensitivity: "base",
        }) === 0
    )?.neighborhoods ?? [];

  const freemium = isNewAdProfileEnabled();
  const notifyHref = params.notify?.trim();
  const adId = params.adId?.trim();

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Cadastro rápido — Plano Grátis</h2>
          <p className="text-sm text-muted-foreground">
            Cria usuário + anúncio simples (título, categoria, bairro e WhatsApp) e
            gera mensagem para avisar o anunciante no Zap.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/cadastro-rapido/lote">Importar CSV em lote</Link>
        </Button>
      </div>

      {!freemium ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Ative <code className="text-xs">NEXT_PUBLIC_NEW_AD_PROFILE</code> para
            usar o cadastro rápido de Plano Grátis.
          </CardContent>
        </Card>
      ) : (
        <>
          {params.error ? (
            <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}

          {params.created === "1" && notifyHref ? (
            <Card className="mb-4 border-whatsapp/40 bg-whatsapp/5">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    Cadastro criado com sucesso
                  </p>
                  <p className="text-muted-foreground">
                    Envie a mensagem com o link do anúncio e o link para o dono
                    reivindicar o perfil.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="whatsapp" size="sm" asChild>
                    <a
                      href={notifyHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Enviar no WhatsApp
                    </a>
                  </Button>
                  {adId ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/anuncio/${adId}`} target="_blank">
                        Ver anúncio
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Novo anúncio grátis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Cidade padrão:{" "}
                <span className="font-medium text-foreground">
                  {defaultLocation.city}/{defaultLocation.state}
                </span>
                . O WhatsApp será o login do anunciante (senha temporária na
                mensagem).
              </p>
              <form
                action={adminCreateQuickFreeListingAction}
                className="grid gap-3 sm:grid-cols-2"
              >
                <div className="sm:col-span-2">
                  <label
                    htmlFor="quick-title"
                    className="mb-1 block text-sm font-medium"
                  >
                    Título do anúncio
                  </label>
                  <Input
                    id="quick-title"
                    name="title"
                    placeholder="Ex.: Pedreiro em Nazaré"
                    required
                    maxLength={120}
                  />
                </div>

                <div className="sm:col-span-2">
                  <AdvertisementCategoryFields categories={categories} />
                </div>

                <div>
                  <label
                    htmlFor="quick-neighborhood"
                    className="mb-1 block text-sm font-medium"
                  >
                    Bairro
                  </label>
                  {neighborhoods.length > 0 ? (
                    <select
                      id="quick-neighborhood"
                      name="neighborhood"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Selecione o bairro
                      </option>
                      {neighborhoods.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id="quick-neighborhood"
                      name="neighborhood"
                      placeholder="Bairro"
                      required
                    />
                  )}
                </div>

                <div>
                  <label
                    htmlFor="quick-whatsapp"
                    className="mb-1 block text-sm font-medium"
                  >
                    WhatsApp
                  </label>
                  <Input
                    id="quick-whatsapp"
                    name="whatsapp"
                    placeholder="91999999999"
                    required
                    inputMode="tel"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button type="submit" variant="whatsapp">
                    Criar usuário e anúncio
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
