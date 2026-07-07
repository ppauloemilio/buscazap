export interface PixChargeInput {
  readonly amount: number;
  readonly description: string;
  readonly payerEmail: string;
  readonly externalReference: string;
}

export interface PixChargeResult {
  readonly pixTxId: string;
  readonly pixCopyPaste: string;
}

export interface PixProvider {
  createCharge(input: PixChargeInput): Promise<PixChargeResult>;
}
