import Link from "next/link";
import { redirect } from "next/navigation";
import { listAdminProviders } from "@/application/services/admin-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminProviderActions } from "@/features/admin/components/admin-provider-actions";
import { getAdminProviderStatusLabel } from "@/config/admin";
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
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const providers = await listAdminProviders({
    status: params.status,
  });

  function buildFilterUrl(status?: string) {
    if (!status) return "/admin/usuarios";
    return `/admin/usuarios?status=${status}`;
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Usuários (prestadores)</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant={!params.status ? "default" : "outline"} size="sm" asChild>
            <Link href={buildFilterUrl()}>Todos</Link>
          </Button>
          <Button
            variant={params.status === "ACTIVE" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={buildFilterUrl("ACTIVE")}>Ativos</Link>
          </Button>
          <Button
            variant={params.status === "BLOCKED" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={buildFilterUrl("BLOCKED")}>Bloqueados</Link>
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
          Status do usuário atualizado.
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
            Nenhum prestador encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{provider.name}</h3>
                      <Badge variant="outline">
                        {getAdminProviderStatusLabel(provider.status)}
                      </Badge>
                      <Badge
                        variant={provider.subscriptionActive ? "whatsapp" : "secondary"}
                      >
                        {provider.subscriptionActive
                          ? "Assinatura ativa"
                          : "Sem assinatura"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{provider.email}</p>
                    <p className="text-sm text-muted-foreground">
                      WhatsApp: {provider.whatsapp}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {provider.advertisementsCount} anúncio(s) · {provider.paymentsCount}{" "}
                      pagamento(s)
                      {provider.city && provider.state
                        ? ` · ${provider.city}/${provider.state}`
                        : ""}
                    </p>
                    {provider.subscriptionExpiresAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Assinatura até{" "}
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
