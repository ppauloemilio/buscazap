import { redirect } from "next/navigation";
import { getLivePricing } from "@/application/services/pricing-settings-service";
import { updatePricingSettingsAction } from "@/actions/admin-billing-actions";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminPricingPageProps {
  readonly searchParams: Promise<{
    readonly saved?: string;
    readonly error?: string;
  }>;
}

export default async function AdminPricingPage({
  searchParams,
}: AdminPricingPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const pricing = await getLivePricing();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Preços dos planos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Valores cobrados via PIX. Alterações valem para novos pagamentos.
        </p>
      </div>

      {params.saved === "1" && (
        <div className="mb-4 rounded-lg bg-whatsapp/10 px-4 py-3 text-sm text-whatsapp">
          Preços salvos com sucesso.
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      )}

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Valores (R$)</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form action={updatePricingSettingsAction} className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Plano Básico / mês</span>
              <Input
                name="subscriptionAmount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={pricing.subscriptionAmount}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Plano Pro / mês</span>
              <Input
                name="subscriptionPlusAmount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={pricing.subscriptionPlusAmount}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Anúncio extra</span>
              <Input
                name="extraAdAmount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={pricing.extraAdAmount}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">WhatsApp extra</span>
              <Input
                name="extraWhatsappAmount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={pricing.extraWhatsappAmount}
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Destaque premium (30 dias)</span>
              <Input
                name="premiumBoostAmount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={pricing.premiumBoostAmount}
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="whatsapp">
                Salvar preços
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
