"use client";

import Link from "next/link";
import { Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionReminderBannerProps {
  readonly active: boolean;
  readonly isAdmin: boolean;
  readonly expiresAt: string | null;
  readonly isTrial: boolean;
  readonly canRenew: boolean;
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
}: SubscriptionReminderBannerProps) {
  if (isAdmin) return null;

  if (!active) {
    return (
      <div className="mb-3 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Sua assinatura está inativa. Assine para publicar e renovar anúncios.</p>
        </div>
        <Button variant="whatsapp" size="sm" asChild>
          <Link href="/painel/assinatura">Fazer assinatura</Link>
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
