import Link from "next/link";
import { redirect } from "next/navigation";
import { listAdminProviders } from "@/application/services/admin-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminProviderActions } from "@/features/admin/components/admin-provider-actions";
import {
  formatAdminPaymentBreakdown,
  getAdminProviderStatusLabel,
} from "@/config/admin";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminUsersPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly deleted?: string;
    readonly status?: string;
    readonly subscription?: string;
    readonly manual?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const providers = await listAdminProviders({
    status: params.status,
    subscription: params.subscription,
  });

  function buildFilterUrl(overrides: {
    readonly status?: string;
    readonly subscription?: string;
  }) {
    const query = new URLSearchParams();
    const merged = {
      status: params.status,
      subscription: params.subscription,
      ...overrides,
    };

    if (merged.status) query.set("status", merged.status);
    if (merged.subscription) query.set("subscription", merged.subscription);

    const qs = query.toString();
    return qs ? `/admin/usuarios?${qs}` : "/admin/usuarios";
  }

  const isExpiredFilter = params.subscription === "expired";

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Usuários (anunciantes)</h2>
          {isExpiredFilter && (
            <p className="mt-1 text-sm text-muted-foreground">
              Exibindo apenas usuários com assinatura vencida.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!params.status && !params.subscription ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={buildFilterUrl({ status: undefined, subscription: undefined })}>
              Todos
            </Link>
          </Button>
          <Button
            variant={params.status === "ACTIVE" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={buildFilterUrl({ status: "ACTIVE", subscription: undefined })}>
              Ativos
            </Link>
          </Button>
          <Button
            variant={params.status === "BLOCKED" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={buildFilterUrl({ status: "BLOCKED", subscription: undefined })}>
              Bloqueados
            </Link>
          </Button>
          <Button
            variant={params.subscription === "active" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={buildFilterUrl({ status: undefined, subscription: "active" })}>
              Assinatura ativa
            </Link>
          </Button>
          <Button
            variant={params.subscription === "expired" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={buildFilterUrl({ status: undefined, subscription: "expired" })}>
              Assinatura vencida
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
          {params.manual === "subscription"
            ? "Assinatura registrada com sucesso (dinheiro/permuta)."
            : "Status do usuário atualizado."}
        </p>
      )}
      {params.deleted === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Usuário excluído.
        </p>
      )}

      {providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum anunciante encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className={provider.subscriptionExpired ? "border-destructive/40" : undefined}
            >
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{provider.name}</h3>
                      <Badge variant="outline">
                        {getAdminProviderStatusLabel(provider.status)}
                      </Badge>
                      {provider.subscriptionActive ? (
                        <Badge variant="whatsapp">Assinatura ativa</Badge>
                      ) : provider.subscriptionExpired ? (
                        <Badge variant="destructive">Assinatura vencida</Badge>
                      ) : (
                        <Badge variant="secondary">Sem assinatura</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{provider.email}</p>
                    <p className="text-sm text-muted-foreground">
                      WhatsApp: {provider.whatsapp}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {provider.advertisementsCount} anúncio(s) ·{" "}
                      {formatAdminPaymentBreakdown({
                        total: provider.paymentsCount,
                        paid: provider.paymentsPaid,
                        pending: provider.paymentsPending,
                        cancelled: provider.paymentsCancelled,
                      })}
                      {provider.city && provider.state
                        ? ` · ${provider.city}/${provider.state}`
                        : ""}
                    </p>
                    {provider.subscriptionExpiresAt && (
                      <p
                        className={`mt-1 text-xs ${
                          provider.subscriptionExpired
                            ? "font-medium text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {provider.subscriptionExpired ? "Venceu em" : "Assinatura até"}{" "}
                        {provider.subscriptionExpiresAt.toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cadastro em {provider.createdAt.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/anuncios?providerId=${provider.id}`}>
                      Ver anúncios
                    </Link>
                  </Button>
                </div>

                <AdminProviderActions
                  providerId={provider.id}
                  currentStatus={provider.status}
                  name={provider.name}
                  advertisementsCount={provider.advertisementsCount}
                  subscriptionActive={provider.subscriptionActive}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
