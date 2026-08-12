import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { searchAdminDirectory } from "@/application/services/admin-search-service";
import { resolveAdvertisementNotifyContexts } from "@/application/services/advertisement-notify-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminAdvertisementNotifyActions } from "@/features/admin/components/admin-advertisement-notify-actions";
import { getCurrentAdmin } from "@/lib/admin-session";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminSearchPageProps {
  readonly searchParams: Promise<{ readonly q?: string }>;
}

export default async function AdminSearchPage({
  searchParams,
}: AdminSearchPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const results = await searchAdminDirectory(q);
  const notifyContexts = await resolveAdvertisementNotifyContexts(
    results.advertisements.map((ad) => ad.id)
  );

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Busca rápida</h2>
        <p className="text-xs text-muted-foreground">
          Localize usuários, anúncios e leads por nome, WhatsApp, título ou cidade.
        </p>
      </div>

      <form className="mb-4 flex flex-col gap-2 sm:flex-row" action="/admin/busca">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Ex.: Paulo, 9199..., Açaí Amazônico..."
            className="pl-9"
            minLength={2}
            required
            autoFocus
          />
        </div>
        <Button type="submit" variant="whatsapp">
          Buscar
        </Button>
      </form>

      {!q ? (
        <p className="text-sm text-muted-foreground">
          Digite ao menos 2 caracteres para buscar.
        </p>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">
                Usuários ({results.providers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {results.providers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum usuário.</p>
              ) : (
                results.providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatWhatsAppDisplay(provider.whatsapp)}
                        {provider.city ? ` · ${provider.city}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{provider.status}</Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/usuarios/${provider.id}/editar`}>
                          Abrir
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">
                Anúncios ({results.advertisements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {results.advertisements.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum anúncio.</p>
              ) : (
                results.advertisements.map((ad) => {
                  const notify = notifyContexts.get(ad.id);

                  return (
                  <div
                    key={ad.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{ad.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ad.category} · {ad.city} · {ad.provider.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{ad.status}</Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/anuncios/${ad.id}/editar`}>
                          Editar
                        </Link>
                      </Button>
                      {notify && (
                        <AdminAdvertisementNotifyActions
                          advertisementId={ad.id}
                          notifyHref={notify.notifyHref}
                          hasStoredPassword={notify.hasStoredPassword}
                          returnTo={`/admin/busca?q=${encodeURIComponent(q)}`}
                          compact
                        />
                      )}
                    </div>
                  </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">
                Leads ({results.leads.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {results.leads.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lead.</p>
              ) : (
                results.leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{lead.adTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.name} · {formatWhatsAppDisplay(lead.whatsapp)} ·{" "}
                        {lead.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{lead.status}</Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/admin/leads">Ver leads</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
