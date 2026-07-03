import { cookies } from "next/headers";
import { PROVIDER_SESSION_COOKIE } from "@/config/pricing";
import { prisma } from "@/lib/prisma";

export async function getCurrentProvider() {
  const cookieStore = await cookies();
  const providerId = cookieStore.get(PROVIDER_SESSION_COOKIE)?.value;

  if (!providerId) {
    return null;
  }

  return prisma.provider.findUnique({
    where: { id: providerId },
  });
}

export async function requireCurrentProvider() {
  const provider = await getCurrentProvider();

  if (!provider) {
    throw new Error("UNAUTHORIZED");
  }

  return provider;
}

export function hasActiveSubscription(subscriptionExpiresAt: Date | null): boolean {
  if (!subscriptionExpiresAt) {
    return false;
  }

  return subscriptionExpiresAt.getTime() > Date.now();
}

export function isPremiumActive(premiumExpiresAt: Date | null): boolean {
  if (!premiumExpiresAt) {
    return false;
  }

  return premiumExpiresAt.getTime() > Date.now();
}
