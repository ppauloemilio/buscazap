import { SubscriptionTier } from "@/domain/enums";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/provider-session";

const PENDING_STALE_MS = 6 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 3;

export type RecurringIssueCode =
  | "ACTIVE_BUT_EXPIRED"
  | "ACTIVE_EXPIRING_SOON"
  | "PENDING_STALE"
  | "PAUSED";

export type AdminRecurringRow = {
  readonly providerId: string;
  readonly name: string;
  readonly email: string | null;
  readonly whatsapp: string | null;
  readonly mpRecurringId: string;
  readonly mpRecurringStatus: string;
  readonly mpRecurringTier: string | null;
  readonly mpRecurringUpdatedAt: Date | null;
  readonly subscriptionExpiresAt: Date | null;
  readonly issues: readonly RecurringIssueCode[];
  readonly hasProblem: boolean;
};

function normalizeStatus(status: string | null | undefined): string {
  return (status ?? "pending").toLowerCase();
}

function isAuthorizedStatus(status: string): boolean {
  return status === "authorized" || status === "active";
}

function classifyIssues(input: {
  readonly status: string;
  readonly updatedAt: Date | null;
  readonly subscriptionExpiresAt: Date | null;
  readonly now: Date;
}): RecurringIssueCode[] {
  const issues: RecurringIssueCode[] = [];
  const { status, updatedAt, subscriptionExpiresAt, now } = input;

  if (status === "pending") {
    const age = updatedAt ? now.getTime() - updatedAt.getTime() : Number.POSITIVE_INFINITY;
    if (age >= PENDING_STALE_MS) {
      issues.push("PENDING_STALE");
    }
  }

  if (isAuthorizedStatus(status)) {
    if (!hasActiveSubscription(subscriptionExpiresAt)) {
      issues.push("ACTIVE_BUT_EXPIRED");
    } else if (subscriptionExpiresAt) {
      const daysLeft = Math.ceil(
        (subscriptionExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft <= EXPIRING_SOON_DAYS) {
        issues.push("ACTIVE_EXPIRING_SOON");
      }
    }
  }

  if (status === "paused") {
    issues.push("PAUSED");
  }

  return issues;
}

export const RECURRING_ISSUE_LABELS: Record<RecurringIssueCode, string> = {
  ACTIVE_BUT_EXPIRED:
    "Recorrência ativa no MP, mas assinatura já vencida no BuscaZapp (possível cobrança sem renovar o prazo)",
  ACTIVE_EXPIRING_SOON:
    "Recorrência ativa e vencimento em até 3 dias — confira se a cobrança vai chegar",
  PENDING_STALE: "Checkout pendente há mais de 6 horas",
  PAUSED: "Assinatura pausada no Mercado Pago",
};

export async function listAdminRecurringSubscriptions(options?: {
  readonly problemsOnly?: boolean;
}): Promise<{
  readonly rows: readonly AdminRecurringRow[];
  readonly problemCount: number;
  readonly totalCount: number;
}> {
  const now = new Date();
  const providers = await prisma.provider.findMany({
    where: {
      mpRecurringId: { not: null },
      role: { not: "ADMIN" },
    },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      mpRecurringId: true,
      mpRecurringStatus: true,
      mpRecurringTier: true,
      mpRecurringUpdatedAt: true,
      subscriptionExpiresAt: true,
    },
    orderBy: [{ mpRecurringUpdatedAt: "desc" }, { name: "asc" }],
  });

  const rows: AdminRecurringRow[] = providers
    .filter((p): p is typeof p & { mpRecurringId: string } => Boolean(p.mpRecurringId))
    .map((p) => {
      const status = normalizeStatus(p.mpRecurringStatus);
      const issues = classifyIssues({
        status,
        updatedAt: p.mpRecurringUpdatedAt,
        subscriptionExpiresAt: p.subscriptionExpiresAt,
        now,
      });
      return {
        providerId: p.id,
        name: p.name,
        email: p.email,
        whatsapp: p.whatsapp,
        mpRecurringId: p.mpRecurringId,
        mpRecurringStatus: status,
        mpRecurringTier: p.mpRecurringTier,
        mpRecurringUpdatedAt: p.mpRecurringUpdatedAt,
        subscriptionExpiresAt: p.subscriptionExpiresAt,
        issues,
        hasProblem: issues.length > 0,
      };
    });

  const problemCount = rows.filter((r) => r.hasProblem).length;
  const filtered = options?.problemsOnly
    ? rows.filter((r) => r.hasProblem)
    : rows;

  return {
    rows: filtered,
    problemCount,
    totalCount: rows.length,
  };
}

export async function countAdminRecurringProblems(): Promise<number> {
  const { problemCount } = await listAdminRecurringSubscriptions({
    problemsOnly: true,
  });
  return problemCount;
}

export function formatRecurringTierLabel(tier: string | null): string {
  return tier === SubscriptionTier.PLUS ? "Plano Pro" : "Plano Básico";
}
