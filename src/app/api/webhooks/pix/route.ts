import { NextResponse } from "next/server";
import { confirmPayment } from "@/application/services/payment-service";

interface PixWebhookPayload {
  readonly pixTxId: string;
  readonly secret?: string;
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  const expectedSecret = process.env.PIX_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PixWebhookPayload;

  try {
    body = (await request.json()) as PixWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!body.pixTxId) {
    return NextResponse.json({ error: "pixTxId is required" }, { status: 400 });
  }

  try {
    const payment = await confirmPayment(body.pixTxId);
    return NextResponse.json({ success: true, paymentId: payment?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
