import { PRICING } from "@/config/pricing";
import {
  getMercadoPagoAccessToken,
  getMercadoPagoTestPayerEmail,
  getPixAppUrl,
  isMercadoPagoTestToken,
  isValidMercadoPagoAccessToken,
} from "@/config/pix";
import type { PixChargeInput, PixChargeResult, PixProvider } from "./types";

interface MercadoPagoPaymentResponse {
  readonly id?: number;
  readonly status?: string;
  readonly point_of_interaction?: {
    readonly transaction_data?: {
      readonly qr_code?: string;
    };
  };
  readonly message?: string;
  readonly error?: string;
  readonly cause?: ReadonlyArray<{ readonly description?: string }>;
}

function extractMercadoPagoError(data: MercadoPagoPaymentResponse): string {
  const causes = data.cause
    ?.map((item) => item.description)
    .filter((item): item is string => Boolean(item));

  if (causes?.length) {
    return causes.join("; ");
  }

  return (
    data.message ??
    data.error ??
    "Falha ao criar cobrança PIX no Mercado Pago"
  );
}

function splitPayerName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "Cliente", lastName: "BuscaZap" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "BuscaZap" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function resolvePayerEmail(
  accessToken: string,
  payerEmail: string
): string {
  const testPayerEmail = getMercadoPagoTestPayerEmail();

  if (isMercadoPagoTestToken(accessToken) && testPayerEmail) {
    return testPayerEmail;
  }

  return payerEmail;
}

function assertAccessToken(accessToken: string): void {
  if (!accessToken) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN não está configurado na Vercel. Copie o Access Token TEST-... e faça redeploy."
    );
  }

  if (!isValidMercadoPagoAccessToken(accessToken)) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN inválido. Na Vercel, use o Access Token (não a Public Key) das credenciais de teste do Mercado Pago."
    );
  }
}

export class MercadoPagoPixProvider implements PixProvider {
  async createCharge(input: PixChargeInput): Promise<PixChargeResult> {
    const accessToken = getMercadoPagoAccessToken();
    const appUrl = getPixAppUrl();
    assertAccessToken(accessToken);

    const { firstName, lastName } = splitPayerName(input.payerName);
    const payerEmail = resolvePayerEmail(accessToken, input.payerEmail);
    const expiresAt = new Date(
      Date.now() + PRICING.PAYMENT_EXPIRATION_MINUTES * 60 * 1000
    );

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": input.externalReference,
      },
      body: JSON.stringify({
        transaction_amount: input.amount,
        description: input.description,
        payment_method_id: "pix",
        external_reference: input.externalReference,
        date_of_expiration: expiresAt.toISOString(),
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        payer: {
          email: payerEmail,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: "CPF",
            number: "19119119100",
          },
        },
      }),
    });

    const data = (await response.json()) as MercadoPagoPaymentResponse;

    if (!response.ok || !data.id) {
      const detail = extractMercadoPagoError(data);

      if (isMercadoPagoTestToken(accessToken) && !getMercadoPagoTestPayerEmail()) {
        throw new Error(
          `${detail}. Em modo teste, configure MERCADOPAGO_TEST_PAYER_EMAIL na Vercel com o e-mail do comprador de teste do Mercado Pago.`
        );
      }

      if (detail.toLowerCase().includes("unauthorized use of live credentials")) {
        throw new Error(
          "Unauthorized use of live credentials: use o Access Token APP_USR- das Credenciais de produção da SUA conta (não de conta de teste). Remova MERCADOPAGO_TEST_PAYER_EMAIL na Vercel, cadastre uma chave PIX no Mercado Pago e faça redeploy."
        );
      }

      if (detail.toLowerCase().includes("payer email forbidden")) {
        throw new Error(
          "Payer email forbidden: o sandbox do Mercado Pago (token TEST-...) não aceita PIX com comprador de teste. Troque MERCADOPAGO_ACCESS_TOKEN na Vercel pelo Access Token de produção (APP_USR-...) e remova MERCADOPAGO_TEST_PAYER_EMAIL. Depois faça redeploy."
        );
      }

      if (detail.toLowerCase().includes("invalid users involved")) {
        throw new Error(
          "Invalid users involved: em modo teste, MERCADOPAGO_TEST_PAYER_EMAIL na Vercel deve ser o e-mail do COMPRADOR de teste (test_user_...@testuser.com), não do vendedor nem demo@buscazap.com.br."
        );
      }

      if (detail.toLowerCase().includes("authorization")) {
        throw new Error(
          `${detail}. Verifique se copiou o Access Token (TEST-...) e não a Public Key nas credenciais do Mercado Pago.`
        );
      }

      throw new Error(detail);
    }

    const pixCopyPaste = data.point_of_interaction?.transaction_data?.qr_code;

    if (!pixCopyPaste) {
      throw new Error("Mercado Pago não retornou o código PIX");
    }

    return {
      pixTxId: String(data.id),
      pixCopyPaste,
    };
  }
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  const accessToken = getMercadoPagoAccessToken();
  assertAccessToken(accessToken);

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Não foi possível consultar o pagamento no Mercado Pago");
  }

  return (await response.json()) as MercadoPagoPaymentResponse;
}
