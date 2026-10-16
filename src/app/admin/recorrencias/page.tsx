import Link from "next/link";
import { redirect } from "next/navigation";
import {
  syncAdminRecurringProblemsAction,
  syncAdminRecurringProviderAction,
} from "@/actions/admin-actions";
import {
  formatRecurringTierLabel,
  listAdminRecurringSubscriptions,
  RECURRING_ISSUE_LABELS,
  type RecurringIssueCode,
} from "@/application/services/admin-recurring-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  readonly searchParams: Promise<{
    readonly filter?: string;
    readonly error?: string;
    readonly synced?: string;
    readonly syncedBatch?: string;
    readonly charges?: string;
    readonly partialError?: string;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  authorized: "Ativa",
  active: "Ativa",
  paused: "Pausada",
  cancelled: "Cancelada",
  canceled: "Cancelada",
};

function IssueBadges({ issues }: { readonly issues: readonly RecurringIssueCode[] }) {
  if (issues.length === 0) {
    return <Badge variant="whatsapp">Ok</Badge>;
  }

  return (
    <div className="flex flex-col gap-1">
      {issues.map((code) => (
        <Badge
          key={code}
          variant={code === "ACTIVE_BUT_EXPIRED" ? "destructive" : "secondary"}
          className="w-fit whitespace-normal text-left font-normal"
        >
          {RECURRING_ISSUE_LABELS[code]}
        </Badge>
      ))}
    </div>
  );
}

export default async function AdminRecurringPage({ searchParams }: PageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const problemsOnly = params.filter === "problems";
  const { rows, problemCount, totalCount } =
    await listAdminRecurringSubscriptions({ problemsOnly });

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Assinaturas recorrentes</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe renovação automática no cartão (Mercado Pago). Problemas
            aparecem quando o status local não bate com vencimento ou checkout
            ficou parado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant={problemsOnly ? "outline" : "whatsapp"}
            size="sm"
          >
            <Link href="/admin/recorrencias">Todas ({totalCount})</Link>
          </Button>
          <Button
            asChild
            variant={problemsOnly ? "whatsapp" : "outline"}
            size="sm"
          >
            <Link href="/admin/recorrencias?filter=problems">
              Problemas ({problemCount})
            </Link>
          </Button>
        </div>
      </div>

      {params.error ? (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}
      {params.partialError ? (
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Sincronização parcial: {params.partialError}
        </p>
      ) : null}
      {params.synced === "1" || params.syncedBatch === "1" ? (
        <p className="mb-3 rounded-md border border-whatsapp/30 bg-whatsapp/10 px-3 py-2 text-sm">
          Sincronizado com o Mercado Pago
          {params.charges != null
            ? ` — ${params.charges} cobrança(s) aplicada(s) ao prazo.`
            : "."}
        </p>
      ) : null}

      {problemCount > 0 ? (
        <Card className="mb-4 border-amber-200/80 bg-amber-50/60">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-950">
              <span className="font-medium">{problemCount}</span> recorrência(s)
              precisam de atenção. Sincronizar consulta o MP e aplica cobranças
              aprovadas que o webhook não entregou.
            </p>
            <form action={syncAdminRecurringProblemsAction}>
              <Button type="submit" size="sm" variant="outline">
                Sincronizar problemas
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {problemsOnly
              ? "Nenhum problema de recorrência no momento."
              : "Nenhuma renovação automática cadastrada ainda."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card
              key={row.providerId}
              className={
                row.hasProblem ? "border-amber-200/90" : undefined
              }
            >
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{row.name}</p>
                    <Badge variant="outline">
                      {STATUS_LABELS[row.mpRecurringStatus] ??
                        row.mpRecurringStatus}
                    </Badge>
                    <Badge variant="secondary">
                      {formatRecurringTierLabel(row.mpRecurringTier)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.email ?? "Sem e-mail"}
                    {row.whatsapp
                      ? ` · ${formatWhatsAppDisplay(row.whatsapp)}`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vencimento no BuscaZapp:{" "}
                    {row.subscriptionExpiresAt
                      ? row.subscriptionExpiresAt.toLocaleDateString("pt-BR")
                      : "—"}
                    {row.mpRecurringUpdatedAt
                      ? ` · Atualizado ${row.mpRecurringUpdatedAt.toLocaleString("pt-BR")}`
                      : ""}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    MP: {row.mpRecurringId}
                  </p>
                  <IssueBadges issues={row.issues} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/usuarios/${row.providerId}/editar`}>
                      Usuário
                    </Link>
                  </Button>
                  <form action={syncAdminRecurringProviderAction}>
                    <input
                      type="hidden"
                      name="providerId"
                      value={row.providerId}
                    />
                    <Button type="submit" size="sm" variant="whatsapp">
                      Sincronizar MP
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
