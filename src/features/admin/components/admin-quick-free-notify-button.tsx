"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { adminOpenQuickFreeWelcomeNotifyAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

interface AdminQuickFreeNotifyButtonProps {
  readonly advertisementId: string;
  readonly notifyHref: string;
  readonly alreadyNotified?: boolean;
}

export function AdminQuickFreeNotifyButton({
  advertisementId,
  notifyHref,
  alreadyNotified = false,
}: AdminQuickFreeNotifyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);
  const [marked, setMarked] = useState(alreadyNotified);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const popup = window.open("about:blank", "_blank");
    setError(null);
    setFallbackHref(null);

    const formData = new FormData();
    formData.set("advertisementId", advertisementId);

    startTransition(async () => {
      const result = await adminOpenQuickFreeWelcomeNotifyAction(formData);
      if (!result.ok) {
        popup?.close();
        setError(result.error);
        return;
      }

      setMarked(true);
      const href = result.notifyHref || notifyHref;

      if (popup && !popup.closed) {
        popup.location.href = href;
        popup.focus();
        return;
      }

      const opened = window.open(href, "_blank", "noopener,noreferrer");
      if (!opened) {
        setFallbackHref(href);
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="whatsapp"
        size="sm"
        disabled={isPending}
        onClick={handleClick}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {isPending ? "Abrindo..." : marked ? "Avisar de novo" : "Avisar no WhatsApp"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {fallbackHref ? (
        <a
          href={fallbackHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-whatsapp underline"
        >
          Abrir WhatsApp manualmente
        </a>
      ) : null}
    </div>
  );
}
