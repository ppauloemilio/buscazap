import { randomBytes } from "crypto";
import { PRICING } from "@/config/pricing";
import type { PixChargeInput, PixChargeResult, PixProvider } from "./types";

function generatePixTxId(): string {
  return `BZ${Date.now()}${randomBytes(4).toString("hex").toUpperCase()}`;
}

function generatePixCopyPaste(amount: number, txId: string): string {
  return `00020126580014BR.GOV.BCB.PIX0136${PRICING.PIX_KEY}520400005303986540${amount.toFixed(2)}5802BR5914BuscaZapp Pag6009SAO PAULO62070503***6304${txId.slice(-4)}`;
}

export class StaticPixProvider implements PixProvider {
  async createCharge(input: PixChargeInput): Promise<PixChargeResult> {
    const pixTxId = generatePixTxId();

    return {
      pixTxId,
      pixCopyPaste: generatePixCopyPaste(input.amount, pixTxId),
    };
  }
}
