/**
 * Normaliza WhatsApp brasileiro para identidade (somente dígitos + 55).
 * Aceita: (91) 99999-9999, 91999999999, +55 91 99999-9999, etc.
 */
export function normalizeWhatsAppIdentity(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (!digits) return null;

  digits = digits.replace(/^0+/, "");
  if (!digits) return null;

  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  if (!digits.startsWith("55")) return null;
  if (digits.length < 12 || digits.length > 13) return null;

  const ddd = Number(digits.slice(2, 4));
  if (ddd < 11 || ddd > 99) return null;

  return digits;
}

/** DDD + número, sem DDI 55 — formato comum para login/exibição (ex.: 91983632551). */
export function toLocalWhatsAppDigits(input: string): string {
  const normalized = normalizeWhatsAppIdentity(input);
  if (normalized) {
    return normalized.slice(2);
  }

  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits.slice(2);
  }

  return digits;
}

export function formatWhatsAppDisplay(digits: string): string {
  const local = toLocalWhatsAppDigits(digits);
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return digits;
}

export function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}
