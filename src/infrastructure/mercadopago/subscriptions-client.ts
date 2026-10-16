import {
  getMercadoPagoSubscriptionsAccessToken,
  isMercadoPagoSubscriptionsEnabled,
} from "@/config/mercadopago-subscriptions";

export type MercadoPagoPreapproval = {
  readonly id?: string;
  readonly status?: string;
  readonly init_point?: string;
  readonly sandbox_init_point?: string;
  readonly external_reference?: string;
  readonly preapproval_plan_id?: string;
  readonly reason?: string;
  readonly payer_email?: string;
  readonly auto_recurring?: {
    readonly transaction_amount?: number;
    readonly currency_id?: string;
    readonly frequency?: number;
    readonly frequency_type?: string;
  };
  readonly summarized?: {
    readonly charged_quantity?: number;
    readonly last_charged_date?: string;
    readonly last_charged_amount?: number;
  };
  readonly message?: string;
  readonly error?: string;
};

export type MercadoPagoAuthorizedPayment = {
  readonly id?: number | string;
  readonly preapproval_id?: string;
  readonly payment?: {
    readonly id?: number | string;
    readonly status?: string;
    readonly status_detail?: string;
    readonly transaction_amount?: number;
  };
  readonly transaction_amount?: number;
  readonly status?: string;
  readonly external_reference?: string;
  readonly message?: string;
  readonly error?: string;
};

function requireSubscriptionsToken(): string {
  if (!isMercadoPagoSubscriptionsEnabled()) {
    throw new Error(
      "Assinaturas Mercado Pago não configuradas (MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN)"
    );
  }
  return getMercadoPagoSubscriptionsAccessToken();
}

async function mpFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ readonly ok: boolean; readonly status: number; readonly data: T }> {
  const token = requireSubscriptionsToken();
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as T;
  return { ok: response.ok, status: response.status, data };
}

/**
 * Assinatura SEM plano associado + status pending.
 * O anunciante escolhe o cartão no init_point do MP (sem card_token_id no server).
 */
export async function createMercadoPagoPreapproval(input: {
  readonly reason: string;
  readonly payerEmail: string;
  readonly externalReference: string;
  readonly backUrl: string;
  readonly amount: number;
  /** ISO 8601 — adia a 1ª cobrança (ex.: até o vencimento atual). */
  readonly startDate?: string;
}): Promise<MercadoPagoPreapproval> {
  const autoRecurring: Record<string, unknown> = {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: input.amount,
    currency_id: "BRL",
  };

  if (input.startDate) {
    autoRecurring.start_date = input.startDate;
  }

  const body = {
    reason: input.reason,
    external_reference: input.externalReference,
    payer_email: input.payerEmail,
    back_url: input.backUrl,
    status: "pending",
    auto_recurring: autoRecurring,
  };

  const { ok, status, data } = await mpFetch<MercadoPagoPreapproval>(
    "/preapproval",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  if (!ok || !data.id) {
    throw new Error(
      data.message ??
        data.error ??
        `Falha ao criar assinatura no Mercado Pago (HTTP ${status})`
    );
  }

  return data;
}

export async function fetchMercadoPagoPreapproval(
  preapprovalId: string
): Promise<MercadoPagoPreapproval> {
  const { ok, status, data } = await mpFetch<MercadoPagoPreapproval>(
    `/preapproval/${encodeURIComponent(preapprovalId)}`
  );

  if (!ok) {
    throw new Error(
      data.message ??
        data.error ??
        `Falha ao consultar assinatura (HTTP ${status})`
    );
  }

  return data;
}

export async function cancelMercadoPagoPreapproval(
  preapprovalId: string
): Promise<MercadoPagoPreapproval> {
  const { ok, status, data } = await mpFetch<MercadoPagoPreapproval>(
    `/preapproval/${encodeURIComponent(preapprovalId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" }),
    }
  );

  if (!ok) {
    throw new Error(
      data.message ??
        data.error ??
        `Falha ao cancelar assinatura (HTTP ${status})`
    );
  }

  return data;
}

export async function fetchMercadoPagoAuthorizedPayment(
  authorizedPaymentId: string
): Promise<MercadoPagoAuthorizedPayment> {
  const { ok, status, data } = await mpFetch<MercadoPagoAuthorizedPayment>(
    `/authorized_payments/${encodeURIComponent(authorizedPaymentId)}`
  );

  if (!ok) {
    throw new Error(
      data.message ??
        data.error ??
        `Falha ao consultar cobrança autorizada (HTTP ${status})`
    );
  }

  return data;
}

export type MercadoPagoAuthorizedPaymentSearchItem = {
  readonly id?: number | string;
  readonly preapproval_id?: string;
  readonly status?: string;
  readonly transaction_amount?: number | string;
  readonly debit_date?: string;
  readonly payment?: {
    readonly id?: number | string;
    readonly status?: string;
  };
};

/** Lista cobranças (faturas) de uma assinatura — útil quando o webhook falhou. */
export async function searchMercadoPagoAuthorizedPayments(
  preapprovalId: string,
  limit = 20
): Promise<readonly MercadoPagoAuthorizedPaymentSearchItem[]> {
  const params = new URLSearchParams({
    preapproval_id: preapprovalId,
    offset: "0",
    limit: String(limit),
  });
  const { ok, status, data } = await mpFetch<{
    readonly results?: MercadoPagoAuthorizedPaymentSearchItem[];
    readonly message?: string;
    readonly error?: string;
  }>(`/authorized_payments/search?${params.toString()}`);

  if (!ok) {
    throw new Error(
      data.message ??
        data.error ??
        `Falha ao listar cobranças da assinatura (HTTP ${status})`
    );
  }

  return data.results ?? [];
}

export async function fetchMercadoPagoSubscriptionPayment(
  paymentId: string
): Promise<{
  readonly id?: number | string;
  readonly status?: string;
  readonly transaction_amount?: number;
  readonly external_reference?: string;
  readonly point_of_interaction?: {
    readonly transaction_data?: { readonly subscription_id?: string };
  };
  readonly metadata?: Record<string, unknown>;
  readonly message?: string;
  readonly error?: string;
}> {
  const { ok, status, data } = await mpFetch<{
    readonly id?: number | string;
    readonly status?: string;
    readonly transaction_amount?: number;
    readonly external_reference?: string;
    readonly point_of_interaction?: {
      readonly transaction_data?: { readonly subscription_id?: string };
    };
    readonly metadata?: Record<string, unknown>;
    readonly message?: string;
    readonly error?: string;
  }>(`/v1/payments/${encodeURIComponent(paymentId)}`);

  if (!ok) {
    throw new Error(
      data.message ??
        data.error ??
        `Falha ao consultar pagamento (HTTP ${status})`
    );
  }

  return data;
}

export function resolvePreapprovalCheckoutUrl(
  preapproval: MercadoPagoPreapproval
): string | null {
  // Preferir init_point (sandbox_init_point está deprecado no MP).
  return preapproval.init_point ?? preapproval.sandbox_init_point ?? null;
}
