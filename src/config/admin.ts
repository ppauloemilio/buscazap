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

export function getAdminAdStatusLabel(status: string): string {
  return (
    ADMIN_AD_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status
  );
}
