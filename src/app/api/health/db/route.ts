import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const [advertisementCount, providerCount, approvedCount, databaseInfo] =
      await Promise.all([
        prisma.advertisement.count(),
        prisma.provider.count(),
        prisma.advertisement.count({
          where: { status: { in: ["APPROVED", "PREMIUM"] } },
        }),
        prisma.$queryRaw<
          Array<{ current_database: string; current_schema: string }>
        >`SELECT current_database()::text AS current_database, current_schema()::text AS current_schema`,
      ]);

    return NextResponse.json({
      ok: true,
      database: databaseInfo[0]?.current_database ?? "unknown",
      schema: databaseInfo[0]?.current_schema ?? "unknown",
      counts: {
        advertisements: advertisementCount,
        approvedOrPremium: approvedCount,
        providers: providerCount,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
