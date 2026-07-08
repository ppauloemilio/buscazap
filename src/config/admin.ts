export const ADMIN_PROVIDER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "BLOCKED", label: "Bloqueado" },
] as const;

export const ADMIN_AD_STATUS_OPTIONS = [
  { value: "APPROVED", label: "Aprovado" },
  { value: "PENDING", label: "Pendente" },
  { value: "REJECTED", label: "Rejeitado" },
  { value: "BLOCKED", label: "Bloqueado" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

export const REPORT_STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberta",
  REVIEWED: "Analisada",
  DISMISSED: "Arquivada",
};

export function formatAdminPaymentBreakdown(input: {
  readonly total: number;
  readonly paid: number;
  readonly pending: number;
  readonly cancelled: number;
}): string {
  return `${input.total} pagamento(s) (${input.paid} efetivados, ${input.pending} pendentes, ${input.cancelled} cancelados)`;
}

export function getAdminProviderStatusLabel(status: string): string {
  return (
    ADMIN_PROVIDER_STATUS_OPTIONS.find((item) => item.value === status)?.label ??
    status
  );
}

export function getAdminAdStatusLabel(status: string): string {
  return (
    ADMIN_AD_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status
  );
}
