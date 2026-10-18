import { normalizeWhatsAppIdentity, toLocalWhatsAppDigits } from "@/lib/whatsapp";
import { buildWhatsAppLink } from "@/shared/utils/format";

/** WhatsApp oficial do BuscaZapp para receber o código de reivindicação. */
export function getBuscazappClaimWhatsApp(): string {
  const raw =
    process.env.BUSCAZAPP_CLAIM_WHATSAPP?.trim() ||
    process.env.NEXT_PUBLIC_BUSCAZAPP_WHATSAPP?.trim() ||
    "";
  return normalizeWhatsAppIdentity(raw) ?? raw.replace(/\D/g, "");
}

export function isBuscazappClaimWhatsAppConfigured(): boolean {
  const digits = getBuscazappClaimWhatsApp();
  return digits.length >= 12;
}

export function buildClaimInboundWhatsAppHref(code: string): string | null {
  const to = getBuscazappClaimWhatsApp();
  if (!to) return null;
  const message = `BZ-${code}`;
  return buildWhatsAppLink(to, message);
}

export function formatBuscazappClaimWhatsAppDisplay(): string {
  const to = getBuscazappClaimWhatsApp();
  if (!to) return "";
  const local = toLocalWhatsAppDigits(to);
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  return local || to;
}
