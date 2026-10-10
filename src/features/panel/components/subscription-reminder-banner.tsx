"use client";

import Link from "next/link";
import { Clock, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionReminderBannerProps {
  readonly active: boolean;
  readonly isAdmin: boolean;
  readonly expiresAt: string | null;
  readonly isTrial: boolean;
  readonly canRenew: boolean;
  readonly freeListing?: boolean;
  readonly expiredFullProfile?: boolean;
}

function daysLeft(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function SubscriptionReminderBanner({
  active,
  isAdmin,
  expiresAt,
  isTrial,
  canRenew,
  freeListing = false,
  expiredFullProfile = false,
}: SubscriptionReminderBannerProps) {
  if (isAdmin) return null;

  if (freeListing) {
    return (
      <div className="mb-3 flex flex-col gap-2 rounded-lg border border-whatsapp/25 bg-whatsapp/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm text-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
          <p>
            Plano grátis ativo na busca. Upgrade libera capa, fotos, descrição,
            horário e selo verificado.
          </p>
        </div>
        <Button variant="whatsapp" size="sm" asChild>
          <Link href="/painel/assinatura">Ver planos</Link>
        </Button>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="mb-3 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {expiredFullProfile
              ? "Assinatura vencida: na vitrine seu anúncio aparece como listagem básica. Seus dados continuam salvos — renove para exibir capa, descrição e selo verificado de novo."
              : "Sua assinatura está inativa. Assine para liberar o perfil completo na vitrine."}
          </p>
        </div>
        <Button variant="whatsapp" size="sm" asChild>
          <Link href="/painel/assinatura">Renovar plano</Link>
        </Button>
      </div>
    );
  }

  if (!expiresAt) return null;

  const left = daysLeft(expiresAt);
  const showTrial = isTrial && left <= 10;
  const showRenew = canRenew || left <= 10;

  if (!showTrial && !showRenew) return null;

  return (
    <div className="mb-3 flex flex-col gap-2 rounded-lg border border-whatsapp/30 bg-whatsapp/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2 text-sm">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
        <p>
          {isTrial ? "Seu período grátis" : "Sua assinatura"} termina em{" "}
          <strong>
            {left} dia{left === 1 ? "" : "s"}
          </strong>
          {left === 0 ? " (hoje)" : ""}. Renove para não perder seus anúncios.
        </p>
      </div>
      <Button variant="whatsapp" size="sm" asChild>
        <Link href="/painel/assinatura">
          {canRenew || left <= 10 ? "Renovar" : "Ver assinatura"}
        </Link>
      </Button>
    </div>
  );
}
