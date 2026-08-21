import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isNextProductionBuild() {
  // NEXT_PHASE no `next build`; CI=1 na Vercel só no passo de build (não no runtime).
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.CI === "1"
  );
}

/**
 * Runtime serverless: 1 conexão por instância (PgBouncer poola no Neon).
 * Build (`next build`): limite maior — várias páginas estáticas competem pelo pool.
 */
function databaseUrlWithPoolSettings(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);

    if (isNextProductionBuild()) {
      parsed.searchParams.set("connection_limit", "5");
      if (!parsed.searchParams.has("pool_timeout")) {
        parsed.searchParams.set("pool_timeout", "20");
      }
    } else if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1");
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

function createPrismaClient() {
  const url = databaseUrlWithPoolSettings();

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
