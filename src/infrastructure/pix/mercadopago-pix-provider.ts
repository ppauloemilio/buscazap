import { PIX_CONFIG } from "@/config/pix";
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
  readonly cause?: ReadonlyArray<{ readonly description?: string }>;
}

export class MercadoPagoPixProvider implements PixProvider {
  constructor(
    private readonly accessToken: string,
    private readonly appUrl: string
  ) {}

  async createCharge(input: PixChargeInput): Promise<PixChargeResult> {
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
        notification_url: `${this.appUrl}/api/webhooks/mercadopago`,
        payer: { email: input.payerEmail },
      }),
    });

    const data = (await response.json()) as MercadoPagoPaymentResponse;

    if (!response.ok || !data.id) {
      const detail =
        data.cause?.[0]?.description ??
        data.message ??
        "Falha ao criar cobrança PIX no Mercado Pago";
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
