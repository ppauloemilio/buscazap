"use client";

import Image from "next/image";
import { MessageCircle, X } from "lucide-react";
import type { ClaimedCouponResult } from "@/application/services/provider-coupon-service";
import { Button } from "@/components/ui/button";

interface ClaimedCouponDialogProps {
  readonly claimed: ClaimedCouponResult;
  readonly onClose: () => void;
}

export function ClaimedCouponDialog({
  claimed,
  onClose,
}: ClaimedCouponDialogProps) {
  const issuedLabel = new Date(claimed.issuedAt).toLocaleString("pt-BR");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claimed-coupon-title"
    >
      <div className="relative w-full max-w-sm rounded-xl border bg-background p-5 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <h2
          id="claimed-coupon-title"
          className="pr-8 text-base font-bold text-foreground"
        >
          Seu cupom está pronto
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {claimed.businessName} · {claimed.title}
        </p>

        <div className="mt-4 flex flex-col items-center gap-3">
          <Image
            src={claimed.qrDataUrl}
            alt={`QR Code do cupom ${claimed.code}`}
            width={200}
            height={200}
            unoptimized
            className="rounded-lg border bg-white p-2"
          />
          <p className="text-2xl font-bold tracking-wider text-emerald-700">
            {claimed.code}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Gerado em {issuedLabel}
            <br />
            Envie este código no WhatsApp ou mostre o QR ao anunciante.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {claimed.whatsappLink ? (
            <Button variant="whatsapp" className="w-full" asChild>
              <a
                href={claimed.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar no WhatsApp
              </a>
            </Button>
          ) : null}
          <Button variant="outline" className="w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
