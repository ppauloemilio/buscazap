import type { Metadata } from "next";
import type { Advertisement } from "@/domain/entities";
import { buildAbsoluteUrl, getSiteUrl } from "@/lib/site-url";
import { normalizeWhatsAppIdentity } from "@/lib/whatsapp";

function buildAdvertisementSeoCopy(advertisement: Advertisement) {
  const city = advertisement.location.city;
  const state = advertisement.location.state;
  const category = advertisement.category;
  const place = state ? `${city}/${state}` : city;

  const title = `${advertisement.title} — WhatsApp e contato em ${city}`;
  const descriptionFallback = `Telefone e WhatsApp de ${advertisement.title} (${category}) em ${place}. Encontre o Zap e fale direto pelo BuscaZapp.`;
  const description =
    advertisement.description?.trim() || descriptionFallback;

  return { title, description, city, state, category, place };
}

export function buildAdvertisementMetadata(
  advertisement: Advertisement
): Metadata {
  const { title, description } = buildAdvertisementSeoCopy(advertisement);
  const path =
    advertisement.publicHref?.trim() || `/anuncio/${advertisement.id}`;

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
    keywords: [
      advertisement.title,
      advertisement.category,
      advertisement.location.city,
      "WhatsApp",
      "Zap",
      "telefone",
      "contato",
      "BuscaZapp",
    ],
  };
}

export function buildAdvertisementJsonLd(advertisement: Advertisement) {
  const { description, city, state, category } =
    buildAdvertisementSeoCopy(advertisement);
  const path =
    advertisement.publicHref?.trim() || `/anuncio/${advertisement.id}`;
  const url = buildAbsoluteUrl(path);
  const phone = normalizeWhatsAppIdentity(advertisement.whatsappNumber);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: advertisement.title,
    description,
    url,
    ...(phone ? { telephone: `+${phone}` } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      ...(state ? { addressRegion: state } : {}),
      addressCountry: "BR",
      ...(advertisement.streetAddress
        ? { streetAddress: advertisement.streetAddress }
        : {}),
    },
    areaServed: {
      "@type": "City",
      name: city,
    },
    ...(category
      ? {
          knowsAbout: category,
        }
      : {}),
    ...(advertisement.imageUrl
      ? {
          image: advertisement.imageUrl.startsWith("http")
            ? advertisement.imageUrl
            : buildAbsoluteUrl(advertisement.imageUrl),
        }
      : {}),
    ...(advertisement.rating > 0 && advertisement.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: advertisement.rating,
            reviewCount: advertisement.reviewCount,
          },
        }
      : {}),
    sameAs: [
      getSiteUrl(),
      ...(advertisement.instagram ? [advertisement.instagram] : []),
      ...(advertisement.website ? [advertisement.website] : []),
    ].filter(Boolean),
  };
}
