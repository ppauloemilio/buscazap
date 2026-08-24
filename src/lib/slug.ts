/**
 * Gera slug amigável para URLs públicas (SEO).
 * Ex.: "Açaí Amazônico" → "acai-amazonico"
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Primeiro segmento reservado — não pode ser usado como slug de categoria na URL. */
export const RESERVED_TOP_LEVEL_SEGMENTS = new Set([
  "admin",
  "ajuda",
  "anunciar",
  "anuncio",
  "api",
  "buscar",
  "cadastro",
  "categorias",
  "cidades",
  "como-funciona",
  "denunciar",
  "entrar",
  "esqueci-senha",
  "favoritos",
  "pagamento",
  "painel",
  "parceiro",
  "parceiros",
  "privacidade",
  "redefinir-senha",
  "relatorios",
  "termos",
  "_next",
]);

export function isReservedTopLevelSegment(segment: string): boolean {
  return RESERVED_TOP_LEVEL_SEGMENTS.has(segment.toLowerCase());
}

export function buildAdvertisementPublicPath(input: {
  readonly categorySlug: string;
  readonly adSlug: string;
}): string {
  return `/${input.categorySlug}/${input.adSlug}`;
}
