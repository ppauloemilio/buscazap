import { NextResponse } from "next/server";
import { expirePendingPayments } from "@/application/services/payment-service";
import { expirePremiumBoosts } from "@/application/services/premium-service";
import { expireSubscriptions } from "@/application/services/subscription-service";

function isAuthorizedCron(request: Request): boolean {
  const expectedSecret = process.env.PIX_WEBHOOK_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get("x-cron-secret");
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (expectedSecret && (headerSecret === expectedSecret || bearer === expectedSecret)) {
    return true;
  }

  if (cronSecret && bearer === cronSecret) {
    return true;
  }

  return false;
}

async function runExpireJob() {
  const [expiredSubscriptions, expiredPremiums] = await Promise.all([
    expireSubscriptions(),
    expirePremiumBoosts(),
    expirePendingPayments(),
  ]);

  return { expiredSubscriptions, expiredPremiums };
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runExpireJob();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runExpireJob();
  return NextResponse.json(result);
}
