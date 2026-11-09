import { redirect } from "next/navigation";
import { listBillingCouponsForAdmin } from "@/application/services/billing-coupon-service";
import { listActiveCities } from "@/application/services/catalog-service";
import { AdminBillingCouponsManager } from "@/features/admin/components/admin-billing-coupons-manager";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";

interface AdminBillingCouponsPageProps {
  readonly searchParams: Promise<{
    readonly saved?: string;
    readonly error?: string;
  }>;
}

export default async function AdminBillingCouponsPage({
  searchParams,
}: AdminBillingCouponsPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const params = await searchParams;
  const [coupons, cities] = await Promise.all([
    listBillingCouponsForAdmin(),
    listActiveCities(),
  ]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Cupons de pagamento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Descontos na mensalidade, destaque premium e extras do BuscaZapp.
        </p>
      </div>

      {params.saved === "1" && (
        <div className="mb-4 rounded-lg bg-whatsapp/10 px-4 py-3 text-sm text-whatsapp">
          Cupons atualizados.
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      )}

      <AdminBillingCouponsManager
        coupons={coupons.map((coupon) => ({
          ...coupon,
          startsAt: coupon.startsAt.toISOString(),
          endsAt: coupon.endsAt.toISOString(),
        }))}
        cities={cities.map((city) => ({
          name: city.name,
          stateUf: city.state.uf,
        }))}
      />
    </AdminLayout>
  );
}
