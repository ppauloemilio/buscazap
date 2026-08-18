"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { adminNotifyAdvertisementWithNewPasswordAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

interface AdminAdvertisementNotifyActionsProps {
  readonly advertisementId: string;
  readonly notifyHref: string;
  readonly hasStoredPassword: boolean;
  readonly returnTo?: string;
  readonly compact?: boolean;
}

export function AdminAdvertisementNotifyActions({
  advertisementId,
  notifyHref,
  hasStoredPassword,
  compact = false,
}: AdminAdvertisementNotifyActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);

  function handleNewPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = hasStoredPassword
      ? "Gerar uma senha nova e abrir o WhatsApp? A senha anterior deixa de valer."
      : "Gerar senha provisória e abrir o WhatsApp para o anunciante?";

    if (!window.confirm(message)) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const popup = window.open("about:blank", "_blank");
    setError(null);
    setFallbackHref(null);

    startTransition(async () => {
      const result = await adminNotifyAdvertisementWithNewPasswordAction(formData);

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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="whatsapp" size={compact ? "sm" : "sm"} asChild>
          <a href={notifyHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-3.5 w-3.5" />
            Avisar no WhatsApp
          </a>
        </Button>

        <form onSubmit={handleNewPassword}>
          <input type="hidden" name="advertisementId" value={advertisementId} />
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            {isPending
              ? "Gerando senha..."
              : hasStoredPassword
                ? "Senha nova + WhatsApp"
                : "Gerar senha + WhatsApp"}
          </Button>
        </form>
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {fallbackHref && (
        <Button size="sm" variant="whatsapp" asChild>
          <a href={fallbackHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-3.5 w-3.5" />
            Abrir WhatsApp com login e senha
          </a>
        </Button>
      )}
    </div>
  );
}
