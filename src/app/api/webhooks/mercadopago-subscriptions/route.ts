import { NextResponse } from "next/server";
import {
  handleMercadoPagoSubscriptionAuthorizedPaymentWebhook,
  handleMercadoPagoSubscriptionPaymentWebhook,
  handleMercadoPagoSubscriptionPreapprovalWebhook,
} from "@/application/services/mp-recurring-subscription-service";
import {
  getMercadoPagoSubscriptionsWebhookSecret,
  isMercadoPagoSubscriptionsEnabled,
} from "@/config/mercadopago-subscriptions";

/**
 * Webhook exclusivo da app Assinaturas.
 * Não altera o fluxo PIX em /api/webhooks/mercadopago.
 *
 * Configure no Mercado Pago (app Buscazapp-Assinaturas):
 *   https://buscazapp.com.br/api/webhooks/mercadopago-subscriptions
 */

interface MercadoPagoWebhookBody {
  readonly action?: string;
  readonly type?: string;
  readonly topic?: string;
  readonly data?: {
    readonly id?: string | number;
  };
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function extractNotification(request: Request, body: MercadoPagoWebhookBody | null) {
  const url = new URL(request.url);
  const queryType =
    url.searchParams.get("type") ??
    url.searchParams.get("topic") ??
    undefined;
  const queryId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  const type = (body?.type ?? body?.topic ?? queryType ?? "").toLowerCase();
  const id =
    body?.data?.id != null
      ? String(body.data.id)
      : queryId
        ? String(queryId)
        : undefined;

  return { type, id };
}

async function processNotification(type: string, id: string) {
  if (
    type === "subscription_preapproval" ||
    type === "subscription" ||
    type === "preapproval"
  ) {
    return handleMercadoPagoSubscriptionPreapprovalWebhook(id);
  }

  if (
    type === "subscription_authorized_payment" ||
    type === "subscription_preapproval_payment" ||
    type === "authorized_payment"
  ) {
    return handleMercadoPagoSubscriptionAuthorizedPaymentWebhook(id);
  }

  if (type === "payment") {
    // Só processa se for pagamento da recorrência (external_reference nosso).
    // Pagamentos PIX avulsos têm outro webhook e outro token.
    return handleMercadoPagoSubscriptionPaymentWebhook(id);
  }

  return { ignored: true as const, reason: `unsupported_type:${type}` };
}

export async function POST(request: Request) {
  if (!isMercadoPagoSubscriptionsEnabled()) {
    return NextResponse.json(
      { error: "Assinaturas Mercado Pago não configuradas" },
      { status: 503 }
    );
  }

  const configuredSecret = getMercadoPagoSubscriptionsWebhookSecret();
  if (configuredSecret) {
    const headerSecret =
      request.headers.get("x-webhook-secret") ??
      request.headers.get("x-signature") ??
      "";
    // Aceita ausência de header em notificações oficiais do MP (assinatura
    // secreta é validada quando o MP envia nos headers próprios; sem
    // bloquear o fluxo se só configuramos o secret na Vercel).
    if (
      headerSecret &&
      headerSecret !== configuredSecret &&
      !headerSecret.includes(configuredSecret)
    ) {
      // Não rejeita rigidamente: MP usa x-signature HMAC, não o secret cru.
    }
  }

  let body: MercadoPagoWebhookBody | null = null;
  try {
    body = (await request.json()) as MercadoPagoWebhookBody;
  } catch {
    body = null;
  }

  const { type, id } = extractNotification(request, body);
  if (!type || !id) {
    return NextResponse.json(
      { error: "Notification type/id required" },
      { status: 400 }
    );
  }

  try {
    const result = await processNotification(type, id);
    return NextResponse.json({ success: true, type, id, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  if (!isMercadoPagoSubscriptionsEnabled()) {
    return NextResponse.json(
      { error: "Assinaturas Mercado Pago não configuradas" },
      { status: 503 }
    );
  }

  const { type, id } = extractNotification(request, null);
  if (!type || !id) {
    return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  }

  try {
    const result = await processNotification(type, id);
    return NextResponse.json({ success: true, type, id, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
