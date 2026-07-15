import { normalizeWhatsAppIdentity } from "@/lib/whatsapp";

const WHATSAPP_BASE_URL = "https://wa.me/";

/** Digits for wa.me links; prefers identity normalization when possible. */
export function sanitizeWhatsAppNumber(number: string): string {
  return normalizeWhatsAppIdentity(number) ?? number.replace(/\D/g, "");
}

export function buildWhatsAppLink(
  number: string,
  message?: string
): string {
  const sanitized = sanitizeWhatsAppNumber(number);
  const base = `${WHATSAPP_BASE_URL}${sanitized}`;

  if (!message) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(message)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getAdvertisementTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PROFESSIONAL: "Profissional",
    COMPANY: "Empresa",
    PRODUCT: "Produto",
    SERVICE: "Serviço",
  };

  return labels[type] ?? type;
}
