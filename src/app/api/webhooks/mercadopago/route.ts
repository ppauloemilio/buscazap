import { NextResponse } from "next/server";
import { confirmPayment } from "@/application/services/payment-service";
import { fetchMercadoPagoPayment } from "@/infrastructure/pix/mercadopago-pix-provider";
import { isMercadoPagoPixEnabled } from "@/config/pix";

interface MercadoPagoWebhookBody {
  readonly action?: string;
  readonly type?: string;
  readonly data?: {
    readonly id?: string | number;
  };
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handleMercadoPagoPayment(paymentId: string) {
  const payment = await fetchMercadoPagoPayment(paymentId);

  if (payment.status !== "approved") {
    return NextResponse.json({
      success: true,
      ignored: true,
      status: payment.status ?? "unknown",
    });
  }

  const confirmed = await confirmPayment(paymentId);
  return NextResponse.json({ success: true, paymentId: confirmed?.id });
}

export async function POST(request: Request) {
  if (!isMercadoPagoPixEnabled()) {
    return NextResponse.json(
      { error: "Mercado Pago PIX não configurado" },
      { status: 503 }
    );
  }

  let paymentId: string | undefined;

  try {
    const body = (await request.json()) as MercadoPagoWebhookBody;
    if (body.type === "payment" && body.data?.id != null) {
      paymentId = String(body.data.id);
    }
  } catch {
    // Mercado Pago também pode notificar via query string.
  }

  if (!paymentId) {
    const url = new URL(request.url);
    const topic = url.searchParams.get("topic");
    const id = url.searchParams.get("id");

    if (topic === "payment" && id) {
      paymentId = id;
    }
  }

  if (!paymentId) {
    return NextResponse.json({ error: "Payment id is required" }, { status: 400 });
  }

  try {
    return await handleMercadoPagoPayment(paymentId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  if (!isMercadoPagoPixEnabled()) {
    return NextResponse.json(
      { error: "Mercado Pago PIX não configurado" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const topic = url.searchParams.get("topic");
  const id = url.searchParams.get("id");

  if (topic !== "payment" || !id) {
    return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  }

  try {
    return await handleMercadoPagoPayment(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
