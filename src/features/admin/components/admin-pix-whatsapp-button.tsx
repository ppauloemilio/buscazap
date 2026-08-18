"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type PixActionResult =
  | { ok: true; notifyHref: string; pixCopyPaste: string }
  | { ok: false; error: string };

interface AdminPixWhatsAppButtonProps {
  readonly action: (formData: FormData) => Promise<PixActionResult>;
  readonly hiddenFields: Record<string, string>;
  readonly label: string;
  readonly confirmMessage: string;
  readonly pendingLabel?: string;
}

export function AdminPixWhatsAppButton({
  action,
  hiddenFields,
  label,
  confirmMessage,
  pendingLabel = "Gerando Pix...",
}: AdminPixWhatsAppButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);
  const [pixCopyPaste, setPixCopyPaste] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const popup = window.open("about:blank", "_blank");
    setError(null);
    setFallbackHref(null);
    setPixCopyPaste(null);

    startTransition(async () => {
      const result = await action(formData);

      if (!result.ok) {
        popup?.close();
        setError(result.error);
        return;
      }

      setPixCopyPaste(result.pixCopyPaste);

      if (popup && !popup.closed) {
        popup.location.href = result.notifyHref;
        popup.focus();
        return;
      }

      const opened = window.open(
        result.notifyHref,
        "_blank",
        "noopener,noreferrer"
      );
      if (!opened) {
        setFallbackHref(result.notifyHref);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <form onSubmit={handleSubmit}>
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          <MessageCircle className="h-3.5 w-3.5" />
          {isPending ? pendingLabel : label}
        </Button>
      </form>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {fallbackHref && (
        <Button size="sm" variant="whatsapp" asChild>
          <a href={fallbackHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-3.5 w-3.5" />
            Abrir WhatsApp com Pix
          </a>
        </Button>
      )}

      {pixCopyPaste && (
        <p className="break-all rounded-md border bg-muted/40 p-2 text-[11px] text-muted-foreground">
          Pix gerado: {pixCopyPaste}
        </p>
      )}
    </div>
  );
}
