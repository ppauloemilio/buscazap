import type { Metadata } from "next";
import type { SeoCity } from "@/application/services/city-seo-service";
import { buildCitySeoPath } from "@/application/services/city-seo-service";
import { getPopularCategories } from "@/application/services/analytics-service";
import { searchAdvertisements } from "@/application/services/search-service";
import {
  getPublicSearchCatalog,
  neighborhoodNamesFromCatalog,
} from "@/lib/public-search-catalog";
import { SearchResultsView } from "@/features/search/components/search-results-view";
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
  const catalogPromise = getPublicSearchCatalog();
  const [catalog, results, popularCategories] = await Promise.all([
    catalogPromise,
    searchAdvertisements({
      query: "",
      city: city.name,
      sort: "popular",
    }),
    catalogPromise.then((c) => getPopularCategories(c.categories)),
  ]);

  const pagePath = buildCitySeoPath(city.slug);
  const neighborhoods = neighborhoodNamesFromCatalog(catalog, city.name);
  const searchReturnPath = buildSearchHref({ city: city.name });

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
      <SearchResultsView
        city={city.name}
        results={results}
        popularCategories={popularCategories}
        cities={catalog.cityNames}
        neighborhoods={neighborhoods}
        defaultCityName={city.name}
        pageTitle={`Contatos em ${city.name}`}
        returnTo={searchReturnPath}
      />
    </>
  );
}
