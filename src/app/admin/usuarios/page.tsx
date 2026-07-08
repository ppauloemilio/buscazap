import Link from "next/link";
import { redirect } from "next/navigation";
import { listAdminProviders } from "@/application/services/admin-service";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminUsersPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const providers = await listAdminProviders();

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold">Usuários (prestadores)</h2>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum prestador cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{provider.name}</h3>
                    <Badge variant={provider.subscriptionActive ? "whatsapp" : "secondary"}>
                      {provider.subscriptionActive ? "Assinatura ativa" : "Sem assinatura"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{provider.email}</p>
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
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/anuncios?providerId=${provider.id}`}>
                    Ver anúncios
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
