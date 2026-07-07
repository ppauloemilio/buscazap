import { PRICING } from "@/config/pricing";
import { PIX_CONFIG, isMercadoPagoTestToken } from "@/config/pix";
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

function resolvePayerEmail(payerEmail: string): string {
  if (
    isMercadoPagoTestToken(PIX_CONFIG.mercadoPagoAccessToken) &&
    PIX_CONFIG.testPayerEmail
  ) {
    return PIX_CONFIG.testPayerEmail;
  }

  return payerEmail;
}

export class MercadoPagoPixProvider implements PixProvider {
  constructor(
    private readonly accessToken: string,
    private readonly appUrl: string
  ) {}

  async createCharge(input: PixChargeInput): Promise<PixChargeResult> {
    const { firstName, lastName } = splitPayerName(input.payerName);
    const payerEmail = resolvePayerEmail(input.payerEmail);
    const expiresAt = new Date(
      Date.now() + PRICING.PAYMENT_EXPIRATION_MINUTES * 60 * 1000
    );

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": input.externalReference,
      },
      body: JSON.stringify({
        transaction_amount: input.amount,
        description: input.description,
        payment_method_id: "pix",
        external_reference: input.externalReference,
        date_of_expiration: expiresAt.toISOString(),
        notification_url: `${this.appUrl}/api/webhooks/mercadopago`,
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

      if (
        isMercadoPagoTestToken(this.accessToken) &&
        !PIX_CONFIG.testPayerEmail
      ) {
        throw new Error(
          `${detail}. Em modo teste, configure MERCADOPAGO_TEST_PAYER_EMAIL na Vercel com o e-mail do comprador de teste do Mercado Pago.`
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
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${PIX_CONFIG.mercadoPagoAccessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Não foi possível consultar o pagamento no Mercado Pago");
  }

  return (await response.json()) as MercadoPagoPaymentResponse;
}
