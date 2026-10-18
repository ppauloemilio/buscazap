export const CLAIM_REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ClaimRequestStatus =
  (typeof CLAIM_REQUEST_STATUS)[keyof typeof CLAIM_REQUEST_STATUS];

export const CLAIM_REQUEST_STATUS_LABELS: Record<ClaimRequestStatus, string> = {
  PENDING: "Aguardando",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
};

export const CLAIM_REQUEST_STATUS_OPTIONS: readonly ClaimRequestStatus[] = [
  CLAIM_REQUEST_STATUS.PENDING,
  CLAIM_REQUEST_STATUS.APPROVED,
  CLAIM_REQUEST_STATUS.REJECTED,
];
