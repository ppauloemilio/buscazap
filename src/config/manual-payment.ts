export const MANUAL_PAYMENT_METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "BARTER", label: "Permuta" },
  { value: "OTHER", label: "Outro" },
] as const;

export type ManualPaymentMethod =
  (typeof MANUAL_PAYMENT_METHODS)[number]["value"];

export function isManualPaymentMethod(value: string): value is ManualPaymentMethod {
  return MANUAL_PAYMENT_METHODS.some((method) => method.value === value);
}
