export type PixProviderName = "static" | "mercadopago";

export const PIX_CONFIG = {
  provider: (process.env.PIX_PROVIDER ?? "static") as PixProviderName,
  mercadoPagoAccessToken: (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim(),
  appUrl:
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"),
  webhookSecret: process.env.PIX_WEBHOOK_SECRET ?? "",
  enableSimulate: process.env.PIX_ENABLE_SIMULATE === "true",
  testPayerEmail: process.env.MERCADOPAGO_TEST_PAYER_EMAIL ?? "",
} as const;

export function isMercadoPagoTestToken(token: string): boolean {
  return token.startsWith("TEST-");
}

export function isMercadoPagoPixEnabled(): boolean {
  return (
    PIX_CONFIG.provider === "mercadopago" &&
    PIX_CONFIG.mercadoPagoAccessToken.length > 0
  );
}
