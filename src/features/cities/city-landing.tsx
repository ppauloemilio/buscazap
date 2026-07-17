import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search, Megaphone } from "lucide-react";
import { searchAdvertisements } from "@/application/services/search-service";
import { AdvertisementCard } from "@/features/dashboard/components/advertisement-card";
import { Button } from "@/components/ui/button";
import { URGENT_SEARCHES } from "@/config/quick-searches";
import { buildSearchHref } from "@/shared/utils/search-preferences";

interface CityLandingProps {
  readonly city: string;
  readonly state: string;
  readonly slug: string;
  readonly headline: string;
  readonly description: string;
}

export function buildCityMetadata(city: string, state: string): Metadata {
  return {
    title: `WhatsApp em ${city}/${state} — gás, água, delivery e serviços`,
    description: `Encontre contacts de WhatsApp em ${city} no BuscaZapp. Gás, água, delivery, serviços locais e mais — direto no seu celular.`,
  };
}

export async function CityLandingPage({
  city,
  state,
  slug,
  headline,
  description,
}: CityLandingProps) {
  const results = await searchAdvertisements({
    query: "",
    city,
    sort: "recent",
  });

  const featured = results.slice(0, 8);

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="mb-6 max-w-2xl">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-whatsapp">
          <MapPin className="h-4 w-4" />
          {city} — {state}
        </p>
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">{headline}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="whatsapp" size="sm" asChild>
            <Link href={buildSearchHref({ city })}>
              <Search className="h-4 w-4" />
              Buscar em {city}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/anunciar">
              <Megaphone className="h-4 w-4" />
              Anuncie grátis
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold">Buscas rápidas</h2>
        <div className="flex flex-wrap gap-1.5">
          {URGENT_SEARCHES.slice(0, 6).map((item) => (
            <Link
              key={item.label}
              href={buildSearchHref({ query: item.query, city })}
              className="rounded-full border px-3 py-1 text-xs font-medium hover:border-whatsapp hover:text-whatsapp"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Anúncios em {city}</h2>
        <Link
          href={buildSearchHref({ city })}
          className="text-sm text-whatsapp hover:underline"
        >
          Ver todos
        </Link>
      </div>

      {featured.length === 0 ? (
        <p className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
          Ainda não há anúncios em {city}. Seja o primeiro a{" "}
          <Link href="/cadastro" className="font-medium text-whatsapp hover:underline">
            anunciar
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {featured.map((ad) => (
            <AdvertisementCard key={ad.id} advertisement={ad} />
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Página otimizada para quem busca WhatsApp em {city}. Também atendemos{" "}
        <Link
          href={slug === "belem" ? "/ananindeua" : "/belem"}
          className="text-whatsapp hover:underline"
        >
          {slug === "belem" ? "Ananindeua" : "Belém"}
        </Link>
        .
      </p>
    </section>
  );
}
