import { NextResponse } from "next/server";
import { PIX_CONFIG } from "@/config/pix";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const token = PIX_CONFIG.mercadoPagoAccessToken;

  return NextResponse.json({
    ok: true,
    pixProvider: PIX_CONFIG.provider,
    mercadoPagoTokenConfigured: token.length > 0,
    mercadoPagoTokenType: token.startsWith("TEST-")
      ? "test"
      : token.startsWith("APP_USR-")
        ? "production"
        : token.length > 0
          ? "unknown"
          : "missing",
    testPayerEmailConfigured: PIX_CONFIG.testPayerEmail.length > 0,
    appUrl: PIX_CONFIG.appUrl,
  });
}
