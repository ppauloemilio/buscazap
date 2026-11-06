import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DOWNGRADE_KIND_LABELS,
  listAdminDowngrades,
  type AdminDowngradeFilter,
  type DowngradeKind,
} from "@/application/services/admin-downgrade-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  readonly searchParams: Promise<{
    readonly filter?: string;
  }>;
}

const FILTERS: ReadonlyArray<{
  readonly id: AdminDowngradeFilter;
  readonly label: string;
}> = [
  { id: "all", label: "Todos" },
  { id: "premium", label: "Perdeu premium" },
  { id: "pro-basico", label: "Pro → Básico" },
  { id: "pro-gratis", label: "Pro → Grátis" },
  { id: "basico-gratis", label: "Básico → Grátis" },
];

function parseFilter(value: string | undefined): AdminDowngradeFilter {
  if (
    value === "premium" ||
    value === "pro-basico" ||
    value === "pro-gratis" ||
    value === "basico-gratis"
  ) {
    return value;
  }
  return "all";
}

function formatWhen(date: Date | null): string {
  if (!date) return "data não registrada";
  return date.toLocaleDateString("pt-BR");
}

function badgeVariant(kind: DowngradeKind): "destructive" | "secondary" | "outline" {
  if (kind === "PREMIUM_LOST") return "outline";
  if (kind === "PRO_TO_BASIC") return "secondary";
  return "destructive";
}

export default async function AdminDowngradesPage({ searchParams }: PageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const { rows, counts } = await listAdminDowngrades(filter);

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Quem baixou de nível</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Anunciantes que já tiveram destaque premium e hoje não têm, ou que
          saíram de um plano pago (Pro ou Básico) para um nível menor.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            asChild
            size="sm"
            variant={filter === item.id ? "whatsapp" : "outline"}
          >
            <Link
              href={
                item.id === "all"
                  ? "/admin/rebaixamentos"
                  : `/admin/rebaixamentos?filter=${item.id}`
              }
            >
              {item.label} ({counts[item.id]})
            </Link>
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Ninguém neste filtro no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.providerId}>
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{row.name}</p>
                    <Badge variant="outline">Agora: {row.currentPlan}</Badge>
                    {row.wasPro && row.kinds.includes("BASIC_TO_FREE") ? (
                      <Badge variant="secondary">Já foi Pro</Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {row.kinds.map((kind) => (
                      <Badge key={kind} variant={badgeVariant(kind)}>
                        {DOWNGRADE_KIND_LABELS[kind]}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.email ?? "Sem e-mail"}
                    {` · ${formatWhatsAppDisplay(row.whatsapp)}`}
                    {row.location ? ` · ${row.location}` : ""}
                  </p>
                  {row.kinds.some((kind) => kind !== "PREMIUM_LOST") ? (
                    <p className="text-xs text-muted-foreground">
                      Plano mudou em {formatWhen(row.planChangedAt)}
                      {row.kinds.includes("PRO_TO_BASIC") && !row.planChangedAt
                        ? " (rebaixado para Básico sem nova cobrança)"
                        : ""}
                    </p>
                  ) : null}
                  {row.kinds.includes("PREMIUM_LOST") ? (
                    <p className="text-xs text-muted-foreground">
                      Destaque encerrou em {formatWhen(row.premiumEndedAt)}
                      {row.lostPremiumTitles.length > 0
                        ? ` · ${row.lostPremiumTitles.slice(0, 2).join(", ")}${
                            row.lostPremiumTitles.length > 2
                              ? ` +${row.lostPremiumTitles.length - 2}`
                              : ""
                          }`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/usuarios/${row.providerId}/editar`}>
                    Usuário
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
