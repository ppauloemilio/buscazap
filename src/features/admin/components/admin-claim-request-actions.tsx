"use client";

import { useState, useTransition } from "react";
import { MessageCircle, X } from "lucide-react";
import {
  adminApproveClaimRequestAction,
  adminRejectClaimRequestAction,
} from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

interface AdminClaimRequestActionsProps {
  readonly requestId: string;
}

export function AdminClaimRequestActions({
  requestId,
}: AdminClaimRequestActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);

  function handleApprove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !window.confirm(
        "Confirmei a mensagem no WhatsApp do BuscaZapp?\n\nIsso gera senha temporária e abre o WhatsApp do anunciante com usuário + senha."
      )
    ) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const popup = window.open("about:blank", "_blank");
    setError(null);
    setFallbackHref(null);

    startTransition(async () => {
      const result = await adminApproveClaimRequestAction(formData);

      if (!result.ok) {
        popup?.close();
        setError(result.error);
        return;
      }

      if (popup && !popup.closed) {
        popup.location.href = result.notifyHref;
        popup.focus();
        return;
      }

      const opened = window.open(result.notifyHref, "_blank", "noopener,noreferrer");
      if (!opened) {
        setFallbackHref(result.notifyHref);
      }
    });
  }

  function handleReject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("Recusar este pedido de reivindicação?")) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await adminRejectClaimRequestAction(formData);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleApprove}>
          <input type="hidden" name="requestId" value={requestId} />
          <Button type="submit" variant="whatsapp" size="sm" disabled={isPending}>
            <MessageCircle className="h-3.5 w-3.5" />
            {isPending ? "Enviando..." : "Aprovar + enviar senha"}
          </Button>
        </form>
        <form onSubmit={handleReject}>
          <input type="hidden" name="requestId" value={requestId} />
          <Button type="submit" variant="outline" size="sm" disabled={isPending}>
            <X className="h-3.5 w-3.5" />
            Recusar
          </Button>
        </form>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {fallbackHref ? (
        <a
          href={fallbackHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-whatsapp underline"
        >
          Abrir WhatsApp manualmente
        </a>
      ) : null}
    </div>
  );
}
