/** Domínio canônico público (links de indicação, kit, WhatsApp, e-mails). */
export const CANONICAL_SITE_URL = "https://www.buscazapp.com.br";

function looksLikeVercelPreview(url: string): boolean {
  return /vercel\.app/i.test(url);
}

export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim();

  if (fromEnv) {
    const cleaned = fromEnv.replace(/\/$/, "");
    // Preview/deploy Vercel nunca deve aparecer em links públicos.
    if (looksLikeVercelPreview(cleaned)) {
      return CANONICAL_SITE_URL;
    }
    return cleaned;
  }

  return CANONICAL_SITE_URL;
}

export function buildAbsoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
