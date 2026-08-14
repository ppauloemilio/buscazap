"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdvertisementShareActionsProps {
  readonly shareUrl: string;
  readonly title: string;
  /** Painel do anunciante vs página pública do visitante */
  readonly variant?: "panel" | "public";
  readonly className?: string;
}

export function buildAdvertisementShareMessage(
  title: string,
  shareUrl: string,
  variant: "panel" | "public" = "public"
): string {
  if (variant === "panel") {
    return (
      `Olá! Confira meu anúncio "${title}" no BuscaZapp:\n` +
      `${shareUrl}`
    );
  }

  return (
    `Vi no BuscaZapp: "${title}"\n` +
    `${shareUrl}`
  );
}

export function AdvertisementShareActions({
  shareUrl,
  title,
  variant = "public",
  className,
}: AdvertisementShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const shareMessage = buildAdvertisementShareMessage(title, shareUrl, variant);
  const shareHref = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {variant === "public" && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Share2 className="h-3.5 w-3.5" />
          Compartilhar anúncio
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copiado" : "Copiar link"}
        </Button>
        <Button
          type="button"
          variant={variant === "panel" ? "whatsapp" : "outline"}
          size="sm"
          asChild
        >
          <a href={shareHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-3.5 w-3.5" />
            {variant === "panel" ? "Enviar no WhatsApp" : "WhatsApp"}
          </a>
        </Button>
      </div>
    </div>
  );
}
