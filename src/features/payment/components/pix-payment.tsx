"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check, Loader2 } from "lucide-react";
import { simulatePixPaymentAction } from "@/actions/payment-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PixPaymentProps {
  readonly paymentId: string;
  readonly amount: number;
  readonly pixCopyPaste: string;
  readonly qrCodeDataUrl: string;
  readonly typeLabel: string;
  readonly status: string;
  readonly allowSimulate?: boolean;
}

export function PixPayment({
  paymentId,
  amount,
  pixCopyPaste,
  qrCodeDataUrl,
  typeLabel,
  status,
  allowSimulate = false,
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSimulatePayment() {
    setLoading(true);
    setError(null);

    const result = await simulatePixPaymentAction(paymentId);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  const isPaid = status === "PAID";

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pagamento via PIX</h2>
        <Badge variant={isPaid ? "whatsapp" : "secondary"}>
          {isPaid ? "Pago" : "Aguardando"}
        </Badge>
      </div>

      <p className="mb-1 text-sm text-muted-foreground">{typeLabel}</p>
      <p className="mb-6 text-3xl font-bold text-foreground">
        R$ {amount.toFixed(2).replace(".", ",")}
      </p>

      {!isPaid && (
        <>
          <div className="mb-4 flex justify-center rounded-lg bg-white p-4">
            <Image
              src={qrCodeDataUrl}
              alt="QR Code PIX"
              width={256}
              height={256}
            />
          </div>

          <div className="mb-4 rounded-lg bg-muted p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Pix copia e cola
            </p>
            <p className="break-all text-xs text-foreground">{pixCopyPaste}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={handleCopy} className="w-full">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar código PIX
                </>
              )}
            </Button>

            {allowSimulate && (
              <Button
                variant="whatsapp"
                onClick={handleSimulatePayment}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  "Simular pagamento (dev)"
                )}
              </Button>
            )}
          </div>

          {error && (
            <p className="mt-3 text-center text-sm text-destructive">{error}</p>
          )}
        </>
      )}

      {isPaid && (
        <p className="text-center text-sm text-whatsapp">
          Pagamento confirmado com sucesso!
        </p>
      )}
    </div>
  );
}
