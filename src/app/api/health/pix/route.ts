import { NextResponse } from "next/server";
import {
  getMercadoPagoAccessToken,
  getMercadoPagoTestPayerEmail,
  getPixAppUrl,
  getPixProviderName,
  isValidMercadoPagoAccessToken,
  verifyMercadoPagoAccessToken,
} from "@/config/pix";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const token = getMercadoPagoAccessToken();
  const verification = await verifyMercadoPagoAccessToken(token);

  return NextResponse.json({
    ok: true,
    pixProvider: getPixProviderName(),
    mercadoPagoTokenConfigured: token.length > 0,
    mercadoPagoTokenFormatValid: isValidMercadoPagoAccessToken(token),
    mercadoPagoTokenValid: verification.valid,
    mercadoPagoVerifyError: verification.error ?? null,
    mercadoPagoTokenType: token.startsWith("TEST-")
      ? "test"
      : token.startsWith("APP_USR-")
        ? "production"
        : token.length > 0
          ? "unknown"
          : "missing",
    testPayerEmailConfigured: getMercadoPagoTestPayerEmail().length > 0,
    testPayerEmailLooksValid: getMercadoPagoTestPayerEmail().endsWith("@testuser.com"),
    appUrl: getPixAppUrl(),
  });
}
