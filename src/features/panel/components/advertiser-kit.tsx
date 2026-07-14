"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KitCopyBlockProps {
  readonly title: string;
  readonly text: string;
}

function KitCopyBlock({ title, text }: KitCopyBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-2.5 text-sm">
          {text}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar texto"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface AdvertiserKitProps {
  readonly providerName: string;
  readonly siteUrl: string;
  readonly inviteUrl: string;
  readonly referralCode: string;
}

export function AdvertiserKit({
  providerName,
  siteUrl,
  inviteUrl,
  referralCode,
}: AdvertiserKitProps) {
  const statusText = `Anuncio no BuscaZap — me ache por WhatsApp em ${siteUrl}`;

  const storyText =
    `Precisa de gás, água, delivery ou serviço local? Encontre meu WhatsApp no BuscaZap.\n` +
    `${siteUrl}\n` +
    `Código de indicação: ${referralCode}`;

  const groupText =
    `Olá! Sou ${providerName} e estou no BuscaZap.\n` +
    `Quem precisar pode me achar lá ou indicar outros anunciantes com meu código ${referralCode}:\n` +
    `${inviteUrl}`;

  return (
    <div className="space-y-2.5">
      <KitCopyBlock title="Status do WhatsApp" text={statusText} />
      <KitCopyBlock title="Texto para Stories / status" text={storyText} />
      <KitCopyBlock title="Mensagem para grupos" text={groupText} />
    </div>
  );
}
