"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferralShareActionsProps {
  readonly inviteUrl: string;
  readonly referralCode: string;
}

export function ReferralShareActions({
  inviteUrl,
  referralCode,
}: ReferralShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const shareMessage = `Cadastre-se no BuscaZapp com meu código ${referralCode} e anuncie seu WhatsApp na região: ${inviteUrl}`;
  const shareHref = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar link"}
      </Button>
      <Button variant="whatsapp" size="sm" asChild>
        <a href={shareHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-3.5 w-3.5" />
          Enviar no WhatsApp
        </a>
      </Button>
    </div>
  );
}
