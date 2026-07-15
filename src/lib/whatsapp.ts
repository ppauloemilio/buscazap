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

export function formatWhatsAppDisplay(digits: string): string {
  const normalized = normalizeWhatsAppIdentity(digits) ?? digits.replace(/\D/g, "");
  if (normalized.length === 13) {
    return `(${normalized.slice(2, 4)}) ${normalized.slice(4, 9)}-${normalized.slice(9)}`;
  }
  if (normalized.length === 12) {
    return `(${normalized.slice(2, 4)}) ${normalized.slice(4, 8)}-${normalized.slice(8)}`;
  }
  return digits;
}

export function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}
