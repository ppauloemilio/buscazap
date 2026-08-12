import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, MessageCircle } from "lucide-react";
import { resolveAdvertisementNotifyContexts } from "@/application/services/advertisement-notify-service";
import { listAdminAdvertisements } from "@/application/services/admin-service";
import {
  getCategoriesWithCounts,
  listCityNamesForSearch,
} from "@/application/services/catalog-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminAdvertisementActions } from "@/features/admin/components/admin-advertisement-actions";
import { AdminAdvertisementFilters } from "@/features/admin/components/admin-advertisement-filters";
import { AdminAdvertisementNotifyActions } from "@/features/admin/components/admin-advertisement-notify-actions";
import { getAdminAdStatusLabel } from "@/config/admin";
import { getCurrentAdmin } from "@/lib/admin-session";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { getAdvertisementTypeLabel } from "@/shared/utils/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminAdsPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly deleted?: string;
    readonly status?: string;
    readonly premium?: string;
    readonly providerId?: string;
    readonly q?: string;
    readonly category?: string;
    readonly city?: string;
    readonly type?: string;
    readonly published?: string;
    readonly manual?: string;
    readonly notify?: string;
    readonly password?: string;
  }>;
}

export default async function AdminAdvertisementsPage({
  searchParams,
}: AdminAdsPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const filterState = {
    q: params.q,
    status: params.status,
    category: params.category,
    city: params.city,
    type: params.type,
    published: params.published,
    premium: params.premium,
    providerId: params.providerId,
  };

  const [advertisements, categories, cities] = await Promise.all([
    listAdminAdvertisements({
      status: params.status,
      premium: params.premium === "1",
      providerId: params.providerId,
      category: params.category,
      city: params.city,
      type: params.type,
      query: params.q,
      published:
        params.published === "yes" || params.published === "no"
          ? params.published
          : undefined,
    }),
    getCategoriesWithCounts(),
    listCityNamesForSearch(),
  ]);

  const notifyContexts = await resolveAdvertisementNotifyContexts(
    advertisements.map((ad) => ad.id)
  );

  const notifyHref = params.notify?.trim();

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Anúncios</h2>
        <p className="text-sm text-muted-foreground">
          Filtre por categoria, publicação, cidade e status.
        </p>
      </div>

      <AdminAdvertisementFilters
        filters={filterState}
        categories={categories}
        cities={cities}
        resultCount={advertisements.length}
      />

      {params.error && (
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          {params.manual === "premium"
            ? "Destaque premium registrado com sucesso (dinheiro/permuta)."
            : "Status do anúncio atualizado."}
        </p>
      )}
      {params.deleted === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Anúncio excluído.
        </p>
      )}
      {notifyHref && (
        <div className="mb-4 space-y-2 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          <p className="font-medium">
            {params.password === "1"
              ? "Senha provisória gerada. Abra o WhatsApp para enviar ao anunciante."
              : "Mensagem pronta para o anunciante."}
          </p>
          <Button size="sm" variant="whatsapp" asChild>
            <a href={notifyHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-3.5 w-3.5" />
              Abrir WhatsApp
            </a>
          </Button>
        </div>
      )}

      {advertisements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum anúncio encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {advertisements.map((ad) => {
            const notify = notifyContexts.get(ad.id);

            return (
            <Card key={ad.id}>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{ad.title}</h3>
                      <Badge variant="outline">{getAdminAdStatusLabel(ad.status)}</Badge>
                      <Badge variant="secondary">
                        {getAdvertisementTypeLabel(ad.type)}
                      </Badge>
                      <Badge variant="secondary">{ad.category}</Badge>
                      {ad.premiumActive && (
                        <Badge variant="premium" className="gap-1">
                          <Crown className="h-3 w-3" />
                          Premium pago
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ad.city}/{ad.state}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Anunciante: {ad.provider.name}
                      {ad.provider.email ? ` (${ad.provider.email})` : ""}
                      {" · "}
                      {formatWhatsAppDisplay(ad.provider.whatsapp)}
                    </p>
                    {notify?.hasStoredPassword && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Senha do lead disponível nas observações do lead convertido.
                      </p>
                    )}
                    {ad.premiumActive && ad.premiumExpiresAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Destaque até {ad.premiumExpiresAt.toLocaleDateString("pt-BR")}
                        {ad.lastBoost
                          ? ` · pago R$ ${ad.lastBoost.amount.toFixed(2).replace(".", ",")}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/anuncios/${ad.id}/editar`}>Editar</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/anuncio/${ad.id}`}>Ver público</Link>
                      </Button>
                    </div>
                    {notify && (
                      <AdminAdvertisementNotifyActions
                        advertisementId={ad.id}
                        notifyHref={notify.notifyHref}
                        hasStoredPassword={notify.hasStoredPassword}
                        returnTo="/admin/anuncios"
                        compact
                      />
                    )}
                  </div>
                </div>

                <AdminAdvertisementActions
                  advertisementId={ad.id}
                  currentStatus={ad.status}
                  title={ad.title}
                  premiumActive={ad.premiumActive}
                />
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
