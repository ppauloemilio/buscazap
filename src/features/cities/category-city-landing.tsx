import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search, Megaphone } from "lucide-react";
import type { SeoCity } from "@/application/services/city-seo-service";
import {
  buildCategoryCitySeoPath,
  buildCitySeoPath,
  listActiveSeoCities,
} from "@/application/services/city-seo-service";
import { getCategoriesWithCounts } from "@/application/services/catalog-service";
import { searchAdvertisements } from "@/application/services/search-service";
import { CategoryIcon } from "@/components/category/category-icon";
import { AdvertisementListings } from "@/features/dashboard/components/advertisement-listings";
import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site-url";
import { buildSearchHref } from "@/shared/utils/search-preferences";

type CategoryCityLandingProps = {
  readonly city: SeoCity;
  readonly category: {
    readonly name: string;
    readonly slug: string;
    readonly icon: string;
  };
};

export function buildCategoryCityMetadata({
  city,
  category,
}: CategoryCityLandingProps): Metadata {
  const path = buildCategoryCitySeoPath(city.slug, category.slug);
  const title = `${category.name} em ${city.name} — WhatsApp | BuscaZapp`;
  const description = `Encontre ${category.name.toLowerCase()} em ${city.name}/${city.stateUf} no BuscaZapp. Veja anúncios locais e fale direto no WhatsApp.`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
    },
  };
}

export async function CategoryCityLandingPage({
  city,
  category,
}: CategoryCityLandingProps) {
  const [results, allCategories, otherCities] = await Promise.all([
    searchAdvertisements({
      query: "",
      city: city.name,
      category: category.slug,
      sort: "popular",
    }),
    getCategoriesWithCounts(),
    listActiveSeoCities(),
  ]);

  const featured = results.slice(0, 12);
  const pagePath = buildCategoryCitySeoPath(city.slug, category.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} em ${city.name}`,
    description: `Anúncios de ${category.name} em ${city.name} no BuscaZapp`,
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

  const siblingCategories = allCategories
    .filter((item) => item.slug !== category.slug && item.count > 0)
    .slice(0, 8);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="container mx-auto px-4 py-6">
        <div className="mb-6 max-w-2xl">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-whatsapp">
            <CategoryIcon icon={category.icon} size="sm" />
            {category.name} · {city.name}/{city.stateUf}
          </p>
          <h1 className="mb-2 text-2xl font-bold md:text-3xl">
            {category.name} em {city.name} — contato via WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground">
            Veja anúncios de {category.name.toLowerCase()} em {city.name} e fale
            direto com o anunciante no WhatsApp, sem intermediários.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="whatsapp" size="sm" asChild>
              <Link
                href={buildSearchHref({
                  city: city.name,
                  category: category.slug,
                })}
              >
                <Search className="h-4 w-4" />
                Buscar {category.name}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={buildCitySeoPath(city.slug)}>
                <MapPin className="h-4 w-4" />
                Todos em {city.name}
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

        <div className="mb-6 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {results.length}{" "}
            {results.length === 1 ? "anúncio" : "anúncios"} encontrados
          </h2>
          <Link
            href={buildSearchHref({
              city: city.name,
              category: category.slug,
            })}
            className="text-sm text-whatsapp hover:underline"
          >
            Ver na busca
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
            Ainda não há anúncios de {category.name.toLowerCase()} em {city.name}.{" "}
            <Link href="/cadastro" className="font-medium text-whatsapp hover:underline">
              Seja o primeiro a anunciar
            </Link>
            .
          </p>
        ) : (
          <AdvertisementListings
            advertisements={featured}
            regularTitle={`${category.name} em ${city.name}`}
            viewAllHref={buildSearchHref({
              city: city.name,
              category: category.slug,
            })}
            premiumViewAllHref={buildSearchHref({
              city: city.name,
              category: category.slug,
              premium: true,
            })}
            returnTo={pagePath}
          />
        )}

        {siblingCategories.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-2 text-sm font-semibold">
              Outras categorias em {city.name}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {siblingCategories.map((item) => (
                <Link
                  key={item.slug}
                  href={buildCategoryCitySeoPath(city.slug, item.slug)}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium hover:border-whatsapp hover:text-whatsapp"
                >
                  <CategoryIcon icon={item.icon} size="sm" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {otherCities.length > 1 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Também atendemos:{" "}
            {otherCities
              .filter((item) => item.slug !== city.slug)
              .map((item, index, list) => (
                <span key={item.slug}>
                  <Link
                    href={buildCategoryCitySeoPath(item.slug, category.slug)}
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
