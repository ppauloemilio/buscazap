import { UserRole } from "@/domain/enums";
import { getCurrentProvider, requireCurrentProvider } from "@/lib/provider-session";

export async function getCurrentAdmin() {
  const provider = await getCurrentProvider();

  if (!provider || provider.role !== UserRole.ADMIN) {
    return null;
  }

  return provider;
}

export async function requireAdmin() {
  const provider = await requireCurrentProvider();

  if (provider.role !== UserRole.ADMIN) {
    throw new Error("FORBIDDEN");
  }

  return provider;
}

export function isAdminRole(role: string): boolean {
  return role === UserRole.ADMIN;
}
