import Link from "next/link";
import { redirect } from "next/navigation";
import { listAdminQuickFreeListingsForNotify } from "@/application/services/admin-quick-free-listings-notify-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminQuickFreeNotifyButton } from "@/features/admin/components/admin-quick-free-notify-button";
import {
  AdminQuickFreeNotifyFilters,
  buildQuickFreeAvisosHref,
  type QuickFreeNotifyStatusFilter,
} from "@/features/admin/components/admin-quick-free-notify-filters";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  readonly searchParams: Promise<{
    readonly days?: string;
    readonly category?: string;
    readonly status?: string;
  }>;
}

function parseStatus(
  value: string | undefined
): QuickFreeNotifyStatusFilter | undefined {
  if (value === "pending" || value === "notified") return value;
  return undefined;
}

export default async function AdminQuickFreeAvisosPage({
  searchParams,
}: PageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const daysRaw = Number(params.days ?? "7");
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(daysRaw, 90) : 7;
  const category = params.category?.trim() || undefined;
  const status = parseStatus(params.status);

  const allItems = await listAdminQuickFreeListingsForNotify({ days });

  const categories = [
    ...new Set(allItems.map((item) => item.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const items = allItems.filter((item) => {
    if (category && item.category !== category) return false;
    if (status === "pending" && item.alreadyNotified) return false;
    if (status === "notified" && !item.alreadyNotified) return false;
    return true;
  });

  const pending = items.filter((item) => !item.alreadyNotified).length;
  const filterState = { days, category, status };

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Avisar cadastros rápidos / importação</h2>
          <p className="text-sm text-muted-foreground">
            Anúncios criados por cadastro rápido ou CSV nos últimos {days} dias.
            Use <strong>Avisar no WhatsApp</strong> para reenviar a mensagem com
            o link de reivindicação.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={days === 7 ? "default" : "outline"}
            asChild
          >
            <Link href={buildQuickFreeAvisosHref({ ...filterState, days: 7 })}>
              7 dias
            </Link>
          </Button>
          <Button
            size="sm"
            variant={days === 30 ? "default" : "outline"}
            asChild
          >
            <Link href={buildQuickFreeAvisosHref({ ...filterState, days: 30 })}>
              30 dias
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/cadastro-rapido/lote">Importar CSV</Link>
          </Button>
        </div>
      </div>

      <AdminQuickFreeNotifyFilters
        filters={filterState}
        categories={categories}
        resultCount={items.length}
        pendingCount={pending}
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {allItems.length === 0
              ? "Nenhum cadastro rápido/importação neste período."
              : "Nenhum anúncio corresponde aos filtros selecionados."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.advertisementId}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    {item.alreadyNotified ? (
                      <Badge variant="secondary">Avisado</Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                    {item.claimVerified ? (
                      <Badge variant="secondary">Já reivindicado</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground">
                    {item.category}
                    {item.neighborhood ? ` · ${item.neighborhood}` : ""}
                    {item.city ? ` · ${item.city}` : ""}
                  </p>
                  <p className="font-mono text-xs">{item.whatsappDisplay}</p>
                  <p className="text-xs text-muted-foreground">
                    Importado em {item.importedAt.toLocaleString("pt-BR")}
                    {item.notifiedAt
                      ? ` · último aviso ${item.notifiedAt.toLocaleString("pt-BR")}`
                      : ""}
                  </p>
                  <Link
                    href={item.publicHref}
                    target="_blank"
                    className="text-xs text-whatsapp underline"
                  >
                    Ver anúncio
                  </Link>
                </div>
                <AdminQuickFreeNotifyButton
                  advertisementId={item.advertisementId}
                  notifyHref={item.notifyHref}
                  alreadyNotified={item.alreadyNotified}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
