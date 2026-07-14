import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { FavoritesList } from "@/features/favorites/favorites-list";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Anúncios que você salvou no BuscaZap.",
};

export default function FavoritesPage() {
  return (
    <section className="container mx-auto px-4 py-6">
      <PageHeader
        title="Favoritos"
        description="Seus contatos salvos neste aparelho."
        compact
      />
      <FavoritesList />
    </section>
  );
}
