"use client";

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
  returnTo = "/admin/anuncios",
  compact = false,
}: AdminAdvertisementNotifyActionsProps) {
  function handleNewPassword(event: React.FormEvent<HTMLFormElement>) {
    const message = hasStoredPassword
      ? "Gerar uma senha nova e abrir o WhatsApp? A senha anterior deixa de valer."
      : "Gerar senha provisória e abrir o WhatsApp para o anunciante?";

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="whatsapp"
        size={compact ? "sm" : "sm"}
        asChild
      >
        <a href={notifyHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-3.5 w-3.5" />
          Avisar no WhatsApp
        </a>
      </Button>

      <form
        action={adminNotifyAdvertisementWithNewPasswordAction}
        onSubmit={handleNewPassword}
      >
        <input type="hidden" name="advertisementId" value={advertisementId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <Button type="submit" size="sm" variant="outline">
          {hasStoredPassword ? "Senha nova + WhatsApp" : "Gerar senha + WhatsApp"}
        </Button>
      </form>
    </div>
  );
}
