import { NextResponse } from "next/server";
import { expirePendingPayments } from "@/application/services/payment-service";
import { expirePremiumBoosts } from "@/application/services/premium-service";
import { expireSubscriptions } from "@/application/services/subscription-service";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.PIX_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [expiredSubscriptions, expiredPremiums] = await Promise.all([
    expireSubscriptions(),
    expirePremiumBoosts(),
    expirePendingPayments(),
  ]);

  return NextResponse.json({
    expiredSubscriptions,
    expiredPremiums,
  });
}
