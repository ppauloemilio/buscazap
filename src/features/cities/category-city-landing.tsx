import type { Metadata } from "next";
import type { SeoCity } from "@/application/services/city-seo-service";
import { buildCategoryCitySeoPath } from "@/application/services/city-seo-service";
import { getPopularCategories } from "@/application/services/analytics-service";
import { searchAdvertisements } from "@/application/services/search-service";
import {
  getPublicSearchCatalog,
  neighborhoodNamesFromCatalog,
} from "@/lib/public-search-catalog";
import { SearchResultsView } from "@/features/search/components/search-results-view";
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
  const title = `${category.name} em ${city.name} — WhatsApp, telefone e contatos`;
  const description = `WhatsApp, telefone e Zap de ${category.name.toLowerCase()} em ${city.name}/${city.stateUf}. Veja empresas e prestadores no BuscaZapp e fale direto.`;

  return {
    title,
    description,
    keywords: [
      `${category.name} em ${city.name} WhatsApp`,
      `${category.name} ${city.name} telefone`,
      `Zap ${category.name} ${city.name}`,
      "contato",
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

export async function CategoryCityLandingPage({
  city,
  category,
}: CategoryCityLandingProps) {
  const catalogPromise = getPublicSearchCatalog();
  const [catalog, results, popularCategories] = await Promise.all([
    catalogPromise,
    searchAdvertisements({
      query: "",
      city: city.name,
      category: category.slug,
      sort: "popular",
    }),
    catalogPromise.then((c) => getPopularCategories(c.categories)),
  ]);

  const pagePath = buildCategoryCitySeoPath(city.slug, category.slug);
  const neighborhoods = neighborhoodNamesFromCatalog(catalog, city.name);
  const searchReturnPath = buildSearchHref({
    city: city.name,
    category: category.slug,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} em ${city.name} — WhatsApp e contatos`,
    description: `Telefone, WhatsApp e Zap de ${category.name} em ${city.name}`,
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
        categorySlug={category.slug}
        categoryName={category.name}
        results={results}
        popularCategories={popularCategories}
        cities={catalog.cityNames}
        neighborhoods={neighborhoods}
        defaultCityName={city.name}
        pageTitle={`${category.name} em ${city.name}`}
        returnTo={searchReturnPath}
      />
    </>
  );
}
