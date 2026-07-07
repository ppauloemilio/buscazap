export type PixProviderName = "static" | "mercadopago";

function normalizeEnv(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function getPixProviderName(): PixProviderName {
  return (process.env.PIX_PROVIDER ?? "static") as PixProviderName;
}

export function getMercadoPagoAccessToken(): string {
  return normalizeEnv(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

export function getMercadoPagoTestPayerEmail(): string {
  return normalizeEnv(process.env.MERCADOPAGO_TEST_PAYER_EMAIL);
}

export function getPixAppUrl(): string {
  return (
    normalizeEnv(process.env.APP_URL) ||
    normalizeEnv(process.env.NEXT_PUBLIC_APP_URL) ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

export function getPixWebhookSecret(): string {
  return normalizeEnv(process.env.PIX_WEBHOOK_SECRET);
}

export function isPixSimulateEnabled(): boolean {
  return process.env.PIX_ENABLE_SIMULATE === "true";
}

/** @deprecated Prefer runtime getters above in server code. */
export const PIX_CONFIG = {
  get provider() {
    return getPixProviderName();
  },
  get mercadoPagoAccessToken() {
    return getMercadoPagoAccessToken();
  },
  get appUrl() {
    return getPixAppUrl();
  },
  get webhookSecret() {
    return getPixWebhookSecret();
  },
  get enableSimulate() {
    return isPixSimulateEnabled();
  },
  get testPayerEmail() {
    return getMercadoPagoTestPayerEmail();
  },
} as const;

export function isMercadoPagoTestToken(token: string): boolean {
  return token.startsWith("TEST-");
}

export function isValidMercadoPagoAccessToken(token: string): boolean {
  return token.startsWith("TEST-") || token.startsWith("APP_USR-");
}

export function isMercadoPagoPixEnabled(): boolean {
  return getMercadoPagoAccessToken().length > 0;
}

export async function verifyMercadoPagoAccessToken(token: string): Promise<{
  readonly valid: boolean;
  readonly error?: string;
}> {
  if (!token) {
    return { valid: false, error: "Token ausente" };
  }

  if (!isValidMercadoPagoAccessToken(token)) {
    return {
      valid: false,
      error:
        "Formato inválido. Use o Access Token (TEST-... ou APP_USR-...), não a Public Key.",
    };
  }

  try {
    const response = await fetch("https://api.mercadopago.com/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      return {
        valid: false,
        error:
          data.message ??
          data.error ??
          `Mercado Pago rejeitou o token (HTTP ${response.status})`,
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: "Não foi possível validar o token com o Mercado Pago",
    };
  }
}
