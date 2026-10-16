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
      "Assinaturas Mercado Pago não configuradas (token/planos ausentes)"
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

export async function createMercadoPagoPreapproval(input: {
  readonly planId: string;
  readonly reason: string;
  readonly payerEmail: string;
  readonly externalReference: string;
  readonly backUrl: string;
  /** ISO 8601 — adia a 1ª cobrança (ex.: até o vencimento atual). */
  readonly startDate?: string;
}): Promise<MercadoPagoPreapproval> {
  const body: Record<string, unknown> = {
    preapproval_plan_id: input.planId,
    reason: input.reason,
    external_reference: input.externalReference,
    payer_email: input.payerEmail,
    back_url: input.backUrl,
    status: "pending",
  };

  if (input.startDate) {
    body.auto_recurring = { start_date: input.startDate };
  }

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
  const token = getMercadoPagoSubscriptionsAccessToken();
  const isTest = token.startsWith("TEST-");
  if (isTest && preapproval.sandbox_init_point) {
    return preapproval.sandbox_init_point;
  }
  return preapproval.init_point ?? preapproval.sandbox_init_point ?? null;
}
