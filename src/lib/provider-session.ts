import { cookies } from "next/headers";
import { PRICING, PROVIDER_SESSION_COOKIE } from "@/config/pricing";
import { ProviderStatus, UserRole } from "@/domain/enums";
import { prisma } from "@/lib/prisma";

type ProviderAccessProfile = {
  readonly role: string;
  readonly subscriptionExpiresAt: Date | null;
};

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

export function isAdminProvider(provider: ProviderAccessProfile): boolean {
  return provider.role === UserRole.ADMIN;
}

export function hasActiveSubscription(subscriptionExpiresAt: Date | null): boolean {
  if (!subscriptionExpiresAt) {
    return false;
  }

  return subscriptionExpiresAt.getTime() > Date.now();
}

export function canRenewSubscription(
  subscriptionExpiresAt: Date | null,
  now = new Date()
): boolean {
  if (!subscriptionExpiresAt || !hasActiveSubscription(subscriptionExpiresAt)) {
    return false;
  }

  const msRemaining = subscriptionExpiresAt.getTime() - now.getTime();
  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);

  return daysRemaining <= PRICING.SUBSCRIPTION_RENEWAL_WINDOW_DAYS;
}

export function canProviderPublish(provider: ProviderAccessProfile): boolean {
  return isAdminProvider(provider) || hasActiveSubscription(provider.subscriptionExpiresAt);
}

export function canProviderUsePaidFeatures(provider: ProviderAccessProfile): boolean {
  return canProviderPublish(provider);
}

export function isPremiumActive(premiumExpiresAt: Date | null): boolean {
  if (!premiumExpiresAt) {
    return false;
  }

  return premiumExpiresAt.getTime() > Date.now();
}

export function isProviderBlocked(status: string | null | undefined): boolean {
  return status === ProviderStatus.BLOCKED;
}
