import type { Metadata } from "next";
import { listPublicPromotionCards } from "@/application/services/public-promotions-service";
import { PageHeader } from "@/components/layout/page-header";
import { PromotionsSection } from "@/features/dashboard/components/promotions-section";

export const metadata: Metadata = {
  title: "Promoções — ofertas WhatsApp",
  description:
    "Ofertas e promoções ativas de empresas e prestadores no BuscaZapp. Veja preços e fale no WhatsApp.",
};

export default async function PromocoesPage() {
  const promotions = await listPublicPromotionCards();

  return (
    <>
      <PageHeader
        title="Promoções"
        description="Ofertas ativas de anunciantes Plano Pro"
      />
      {promotions.length === 0 ? (
        <section className="container mx-auto px-4 py-10">
          <p className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma promoção ativa no momento. Volte em breve.
          </p>
        </section>
      ) : (
        <PromotionsSection
          promotions={promotions}
          total={promotions.length}
          showAll
          hideHeader
        />
      )}
    </>
  );
}
