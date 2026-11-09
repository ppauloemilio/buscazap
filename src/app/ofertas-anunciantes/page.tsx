import type { Metadata } from "next";
import Link from "next/link";
import { listPublicBillingCoupons } from "@/application/services/billing-coupon-service";
import { AdvertiserOffersSection } from "@/features/dashboard/components/advertiser-offers-section";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Ofertas para anunciantes",
  description:
    "Cupons de desconto na mensalidade e planos do BuscaZapp para novos anunciantes.",
};

export default async function AdvertiserOffersPage() {
  const coupons = await listPublicBillingCoupons();

  return (
    <>
      <PageHeader
        compact
        title="Ofertas para anunciantes"
        description="Use o código no pagamento da assinatura ou destaque premium"
      />
      <section className="container mx-auto max-w-5xl px-4 py-5">
        {coupons.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma oferta pública no momento. Volte em breve.
            </p>
            <Button variant="whatsapp" className="mt-4" asChild>
              <Link href="/anunciar">Quero anunciar</Link>
            </Button>
          </div>
        ) : (
          <AdvertiserOffersSection
            coupons={coupons}
            showViewAll={false}
            title="Cupons disponíveis"
          />
        )}
      </section>
    </>
  );
}
