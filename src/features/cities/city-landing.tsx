import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search, Megaphone } from "lucide-react";
import type { SeoCity } from "@/application/services/city-seo-service";
import {
  buildCitySeoPath,
  listActiveSeoCities,
} from "@/application/services/city-seo-service";
import { getCategoriesWithCounts } from "@/application/services/catalog-service";
import { searchAdvertisements } from "@/application/services/search-service";
import { CategoryIcon } from "@/components/category/category-icon";
import { AdvertisementListings } from "@/features/dashboard/components/advertisement-listings";
import { Button } from "@/components/ui/button";
import { URGENT_SEARCHES } from "@/config/quick-searches";
import { getSiteUrl } from "@/lib/site-url";
import { buildSearchHref } from "@/shared/utils/search-preferences";

export function buildCityMetadata(city: SeoCity): Metadata {
  const path = buildCitySeoPath(city.slug);
  const title = `Guia de contatos WhatsApp em ${city.name}/${city.stateUf} — empresas e serviços`;
  const description = `Telefones úteis, WhatsApp e Zap de empresas, prestadores e serviços em ${city.name}. Encontre categorias e contatos locais no BuscaZapp.`;

  return {
    title,
    description,
    keywords: [
      `Guia de contatos WhatsApp ${city.name}`,
      `Telefones úteis ${city.name}`,
      `WhatsApp ${city.name}`,
      `Zap ${city.name}`,
      "contato",
      "empresas",
      "serviços",
      "BuscaZapp",
    ],
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
    },
  };
}

export async function CityLandingPage({ city }: { readonly city: SeoCity }) {
  const [results, categories, otherCities] = await Promise.all([
    searchAdvertisements({
      query: "",
      city: city.name,
      sort: "popular",
    }),
    getCategoriesWithCounts(),
    listActiveSeoCities(),
  ]);

  const featured = results.slice(0, 24);
  const topCategories = categories.filter((item) => item.count > 0).slice(0, 8);
  const pagePath = buildCitySeoPath(city.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Guia de contatos WhatsApp em ${city.name}`,
    description: `Telefones, WhatsApp e contatos de empresas e serviços em ${city.name}`,
    url: `${getSiteUrl()}${pagePath}`,
    about: {
      "@type": "Place",
      name: city.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: city.name,
        addressRegion: city.stateUf,
        addressCountry: "BR",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="container mx-auto px-4 py-6">
        <div className="mb-6 max-w-2xl">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-whatsapp">
            <MapPin className="h-4 w-4" />
            {city.name} — {city.stateUf}
          </p>
          <h1 className="mb-2 text-2xl font-bold md:text-3xl">
            Guia de contatos WhatsApp em {city.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Telefones úteis, Zap e WhatsApp de empresas, prestadores e serviços
            locais. Chame direto pelo BuscaZapp, sem app extra.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="whatsapp" size="sm" asChild>
              <Link href={buildSearchHref({ city: city.name })}>
                <Search className="h-4 w-4" />
                Buscar em {city.name}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/anunciar">
                <Megaphone className="h-4 w-4" />
                Anuncie aqui
              </Link>
            </Button>
          </div>
        </div>

        {topCategories.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold">Categorias em {city.name}</h2>
            <div className="flex flex-wrap gap-1.5">
              {topCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={buildSearchHref({
                    city: city.name,
                    category: category.slug,
                  })}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium hover:border-whatsapp hover:text-whatsapp"
                >
                  <CategoryIcon icon={category.icon} size="sm" />
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Buscas rápidas</h2>
          <div className="flex flex-wrap gap-1.5">
            {URGENT_SEARCHES.slice(0, 6).map((item) => (
              <Link
                key={item.label}
                href={buildSearchHref({ query: item.query, city: city.name })}
                className="rounded-full border px-3 py-1 text-xs font-medium hover:border-whatsapp hover:text-whatsapp"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {featured.length === 0 ? (
          <p className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
            Ainda não há anúncios em {city.name}. Seja o primeiro a{" "}
            <Link href="/cadastro" className="font-medium text-whatsapp hover:underline">
              anunciar
            </Link>
            .
          </p>
        ) : (
          <AdvertisementListings
            advertisements={featured}
            regularTitle={`Anúncios em ${city.name}`}
            premiumViewAllHref={buildSearchHref({
              city: city.name,
              premium: true,
            })}
            paidViewAllHref={buildSearchHref({
              city: city.name,
              plan: "paid",
            })}
            freeViewAllHref={buildSearchHref({
              city: city.name,
              plan: "free",
            })}
            returnTo={pagePath}
          />
        )}

        {otherCities.length > 1 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Também atendemos:{" "}
            {otherCities
              .filter((item) => item.slug !== city.slug)
              .map((item, index, list) => (
                <span key={item.slug}>
                  <Link
                    href={buildCitySeoPath(item.slug)}
                    className="text-whatsapp hover:underline"
                  >
                    {item.name}
                  </Link>
                  {index < list.length - 1 ? ", " : ""}
                </span>
              ))}
            .
          </p>
        )}
      </section>
    </>
  );
}
