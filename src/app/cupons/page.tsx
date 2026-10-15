import type { Metadata } from "next";
import { listPublicCouponCards } from "@/application/services/public-coupons-service";
import { PageHeader } from "@/components/layout/page-header";
import { CouponsSection } from "@/features/dashboard/components/coupons-section";

export const metadata: Metadata = {
  title: "Cupons de desconto",
  description:
    "Resgate cupons e economize nas suas empresas favoritas no BuscaZapp.",
};

export default async function CuponsPage() {
  const coupons = await listPublicCouponCards();

  return (
    <>
      <PageHeader
        title="Cupons de desconto"
        description="Resgate cupons e economize nas suas empresas favoritas."
      />
      {coupons.length === 0 ? (
        <section className="container mx-auto px-4 py-10">
          <p className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum cupom disponível no momento. Volte em breve.
          </p>
        </section>
      ) : (
        <CouponsSection
          coupons={coupons}
          total={coupons.length}
          showAll
          hideHeader
        />
      )}
    </>
  );
}
