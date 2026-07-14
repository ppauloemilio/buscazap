import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown } from "lucide-react";
import { listAdminAdvertisements } from "@/application/services/admin-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminAdvertisementActions } from "@/features/admin/components/admin-advertisement-actions";
import { getAdminAdStatusLabel } from "@/config/admin";
import { getCurrentAdmin } from "@/lib/admin-session";
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
  }>;
}

export default async function AdminAdvertisementsPage({
  searchParams,
}: AdminAdsPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const advertisements = await listAdminAdvertisements({
    status: params.status,
    premium: params.premium === "1",
    providerId: params.providerId,
  });

  function buildFilterUrl(overrides: Record<string, string | undefined>) {
    const query = new URLSearchParams();
    const merged = {
      status: params.status,
      premium: params.premium,
      providerId: params.providerId,
      ...overrides,
    };

    Object.entries(merged).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });

    const qs = query.toString();
    return qs ? `/admin/anuncios?${qs}` : "/admin/anuncios";
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Anúncios</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant={!params.premium && !params.status ? "default" : "outline"} size="sm" asChild>
            <Link href={buildFilterUrl({ status: undefined, premium: undefined })}>
              Todos
            </Link>
          </Button>
          <Button variant={params.premium === "1" ? "default" : "outline"} size="sm" asChild>
            <Link href={buildFilterUrl({ premium: "1", status: undefined })}>
              Premium ativos
            </Link>
          </Button>
          <Button variant={params.status === "BLOCKED" ? "default" : "outline"} size="sm" asChild>
            <Link href={buildFilterUrl({ status: "BLOCKED", premium: undefined })}>
              Bloqueados
            </Link>
          </Button>
          <Button variant={params.status === "PENDING" ? "default" : "outline"} size="sm" asChild>
            <Link href={buildFilterUrl({ status: "PENDING", premium: undefined })}>
              Pendentes
            </Link>
          </Button>
        </div>
      </div>

      {params.error && (
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Status do anúncio atualizado.
        </p>
      )}
      {params.deleted === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Anúncio excluído.
        </p>
      )}

      {advertisements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum anúncio encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {advertisements.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{ad.title}</h3>
                      <Badge variant="outline">{getAdminAdStatusLabel(ad.status)}</Badge>
                      {ad.premiumActive && (
                        <Badge variant="premium" className="gap-1">
                          <Crown className="h-3 w-3" />
                          Premium pago
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ad.category} · {ad.city}/{ad.state}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Anunciante: {ad.provider.name} ({ad.provider.email})
                    </p>
                    {ad.premiumActive && ad.premiumExpiresAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Destaque até {ad.premiumExpiresAt.toLocaleDateString("pt-BR")}
                        {ad.lastBoost
                          ? ` · pago R$ ${ad.lastBoost.amount.toFixed(2).replace(".", ",")}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/anuncio/${ad.id}`}>Ver público</Link>
                  </Button>
                </div>

                <AdminAdvertisementActions
                  advertisementId={ad.id}
                  currentStatus={ad.status}
                  title={ad.title}
                  premiumActive={ad.premiumActive}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
