import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Neon + Vercel: 1 conexão por instância serverless (PgBouncer faz o pool real). */
function databaseUrlWithServerlessPoolLimit(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function createPrismaClient() {
  const url = databaseUrlWithServerlessPoolLimit();

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url
      ? {
          datasources: {
            db: { url },
          },
        }
      : {}),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reusa o client em warm instances (dev e produção) para não esgotar o pool.
globalForPrisma.prisma = prisma;
