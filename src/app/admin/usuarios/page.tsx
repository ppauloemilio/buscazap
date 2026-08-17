import Link from "next/link";
import { redirect } from "next/navigation";
import { adminCreateProviderAction } from "@/actions/admin-actions";
import { listAdminProviders } from "@/application/services/admin-service";
import { getCategoriesWithCounts } from "@/application/services/catalog-service";
import { listActiveCatalogLocationOptions } from "@/application/services/catalog-location";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminCreateAdvertisementForm } from "@/features/admin/components/admin-create-advertisement-form";
import { AdminProviderActions } from "@/features/admin/components/admin-provider-actions";
import {
  formatAdminPaymentBreakdown,
  getAdminProviderStatusLabel,
} from "@/config/admin";
import { getCurrentAdmin } from "@/lib/admin-session";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRICING } from "@/config/pricing";

interface AdminUsersPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly saved?: string;
    readonly deleted?: string;
    readonly status?: string;
    readonly subscription?: string;
    readonly ads?: string;
    readonly created?: string;
    readonly manual?: string;
    readonly adId?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const createdDays = params.created === "7" ? 7 : undefined;
  const [providers, categories, locationOptions] = await Promise.all([
    listAdminProviders({
      status: params.status,
      subscription: params.subscription,
      ads: params.ads,
      createdDays,
    }),
    getCategoriesWithCounts(),
    listActiveCatalogLocationOptions(),
  ]);

  function buildFilterUrl(overrides: {
    readonly status?: string;
    readonly subscription?: string;
    readonly ads?: string;
    readonly created?: string;
  }) {
    const query = new URLSearchParams();
    const merged = {
      status: params.status,
      subscription: params.subscription,
      ads: params.ads,
      created: params.created,
      ...overrides,
    };

    if (merged.status) query.set("status", merged.status);
    if (merged.subscription) query.set("subscription", merged.subscription);
    if (merged.ads) query.set("ads", merged.ads);
    if (merged.created) query.set("created", merged.created);

    const qs = query.toString();
    return qs ? `/admin/usuarios?${qs}` : "/admin/usuarios";
  }

  const filterHint =
    params.ads === "none"
      ? "Exibindo usuários cadastrados sem nenhum anúncio."
      : params.created === "7"
        ? "Exibindo cadastros dos últimos 7 dias."
        : params.subscription === "expired"
          ? "Exibindo apenas usuários com assinatura vencida."
          : params.subscription === "trial"
            ? "Exibindo usuários em trial ativo."
            : params.subscription === "paid"
              ? "Exibindo assinantes pagos."
              : params.subscription === "active"
                ? "Exibindo usuários com assinatura ativa."
                : null;

  const hasListFilter = Boolean(
    params.status || params.subscription || params.ads || params.created
  );

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Usuários (anunciantes)</h2>
          {filterHint && (
            <p className="mt-1 text-sm text-muted-foreground">{filterHint}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!hasListFilter ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              href={buildFilterUrl({
                status: undefined,
                subscription: undefined,
                ads: undefined,
                created: undefined,
              })}
            >
              Todos
            </Link>
          </Button>
          <Button
            variant={params.status === "ACTIVE" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              href={buildFilterUrl({
                status: "ACTIVE",
                subscription: undefined,
                ads: undefined,
                created: undefined,
              })}
            >
              Ativos
            </Link>
          </Button>
          <Button
            variant={params.status === "BLOCKED" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              href={buildFilterUrl({
                status: "BLOCKED",
                subscription: undefined,
                ads: undefined,
                created: undefined,
              })}
            >
              Bloqueados
            </Link>
          </Button>
          <Button
            variant={params.subscription === "active" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              href={buildFilterUrl({
                status: undefined,
                subscription: "active",
                ads: undefined,
                created: undefined,
              })}
            >
              Assinatura ativa
            </Link>
          </Button>
          <Button
            variant={params.subscription === "expired" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              href={buildFilterUrl({
                status: undefined,
                subscription: "expired",
                ads: undefined,
                created: undefined,
              })}
            >
              Assinatura vencida
            </Link>
          </Button>
          <Button
            variant={params.ads === "none" ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              href={buildFilterUrl({
                status: undefined,
                subscription: undefined,
                ads: "none",
                created: undefined,
              })}
            >
              Sem anúncio
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
            : params.manual === "created"
              ? "Anunciante cadastrado com sucesso. Agora você pode criar o primeiro anúncio abaixo."
              : params.manual === "password"
                ? "Senha redefinida. Informe o anunciante pelo WhatsApp."
                : params.manual === "ad"
                  ? "Anúncio publicado com sucesso."
                  : "Status do usuário atualizado."}
          {params.manual === "ad" && params.adId ? (
            <>
              {" "}
              <Link
                href={`/anuncio/${params.adId}`}
                className="underline"
                target="_blank"
              >
                Ver anúncio público
              </Link>
            </>
          ) : null}
        </p>
      )}
      {params.deleted === "1" && (
        <p className="mb-4 rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
          Usuário excluído.
        </p>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Novo anunciante</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Cadastro rápido para captação presencial. WhatsApp é o login principal;
            e-mail é opcional.
          </p>
          <form action={adminCreateProviderAction} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="new-name" className="mb-1 block text-xs font-medium">
                Nome
              </label>
              <Input id="new-name" name="name" placeholder="Nome completo" required />
            </div>
            <div>
              <label htmlFor="new-whatsapp" className="mb-1 block text-xs font-medium">
                WhatsApp
              </label>
              <Input
                id="new-whatsapp"
                name="whatsapp"
                placeholder="91999999999"
                required
              />
            </div>
            <div>
              <label htmlFor="new-password" className="mb-1 block text-xs font-medium">
                Senha inicial
              </label>
              <Input
                id="new-password"
                name="password"
                type="text"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <div>
              <label htmlFor="new-email" className="mb-1 block text-xs font-medium">
                E-mail (opcional)
              </label>
              <Input
                id="new-email"
                name="email"
                type="email"
                placeholder="Para PIX e recuperação"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 pb-2 text-xs">
                <input
                  type="checkbox"
                  name="grantTrial"
                  value="true"
                  defaultChecked
                  className="rounded border"
                />
                Trial de {PRICING.LAUNCH_TRIAL_DAYS} dias
              </label>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" variant="whatsapp">
                Cadastrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
                    <p className="text-sm text-muted-foreground">
                      WhatsApp: {formatWhatsAppDisplay(provider.whatsapp)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {provider.email ?? "Sem e-mail"}
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
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/usuarios/${provider.id}/editar`}>
                        Editar
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/anuncios?providerId=${provider.id}`}>
                        Ver anúncios
                      </Link>
                    </Button>
                  </div>
                </div>

                <AdminProviderActions
                  providerId={provider.id}
                  currentStatus={provider.status}
                  name={provider.name}
                  advertisementsCount={provider.advertisementsCount}
                  subscriptionActive={provider.subscriptionActive}
                />

                <AdminCreateAdvertisementForm
                  providerId={provider.id}
                  providerName={provider.name}
                  defaultWhatsapp={provider.whatsapp}
                  defaultOpen={provider.advertisementsCount === 0}
                  canPublish={provider.subscriptionActive}
                  categories={categories}
                  states={locationOptions.states}
                  cities={locationOptions.cities}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
