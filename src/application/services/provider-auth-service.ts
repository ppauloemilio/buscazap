import { prisma } from "@/lib/prisma";
import { looksLikeEmail, normalizeWhatsAppIdentity } from "@/lib/whatsapp";

export async function findProviderByLogin(login: string) {
  const trimmed = login.trim();

  if (looksLikeEmail(trimmed)) {
    return prisma.provider.findUnique({
      where: { email: trimmed.toLowerCase() },
    });
  }

  const whatsapp = normalizeWhatsAppIdentity(trimmed);
  if (!whatsapp) {
    return null;
  }

  return prisma.provider.findUnique({
    where: { whatsapp },
  });
}
