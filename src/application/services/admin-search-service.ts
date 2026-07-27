import { markDataFetchDynamic } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppIdentity } from "@/lib/whatsapp";

export async function searchAdminDirectory(query: string) {
  markDataFetchDynamic();

  const q = query.trim();
  if (q.length < 2) {
    return {
      query: q,
      providers: [] as const,
      advertisements: [] as const,
      leads: [] as const,
    };
  }

  const digits = q.replace(/\D/g, "");
  const whatsappNormalized = normalizeWhatsAppIdentity(q);

  const [providers, advertisements, leads] = await Promise.all([
    prisma.provider.findMany({
      where: {
        role: "PROVIDER",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          ...(digits.length >= 4
            ? [{ whatsapp: { contains: digits } }]
            : []),
          ...(whatsappNormalized
            ? [{ whatsapp: { contains: whatsappNormalized } }]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        status: true,
        city: true,
      },
    }),
    prisma.advertisement.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { whatsappNumber: { contains: digits.length >= 4 ? digits : q } },
          { slug: { contains: q, mode: "insensitive" } },
          {
            provider: {
              name: { contains: q, mode: "insensitive" },
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        title: true,
        category: true,
        city: true,
        status: true,
        slug: true,
        provider: { select: { id: true, name: true } },
      },
    }),
    prisma.providerLead.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { adTitle: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          ...(digits.length >= 4
            ? [
                { whatsapp: { contains: digits } },
                { secondaryWhatsapp: { contains: digits } },
              ]
            : []),
          ...(whatsappNormalized
            ? [
                { whatsapp: { contains: whatsappNormalized } },
                { secondaryWhatsapp: { contains: whatsappNormalized } },
              ]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        name: true,
        adTitle: true,
        whatsapp: true,
        city: true,
        status: true,
      },
    }),
  ]);

  return { query: q, providers, advertisements, leads };
}
