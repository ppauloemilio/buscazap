"use client";

import { useFormStatus } from "react-dom";
import {
  boostAdvertisementAction,
  redeemReferralPremiumAction,
} from "@/actions/provider-actions";
import { Button } from "@/components/ui/button";

interface BoostAdvertisementFormProps {
  readonly advertisementId: string;
  readonly paidLabel: string;
  readonly freeCredits?: number;
  readonly referralDays?: number;
}

function PaidSubmitButton({ label }: { readonly label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="whatsapp" size="sm" disabled={pending}>
      {pending ? "Gerando PIX..." : label}
    </Button>
  );
}

function CreditSubmitButton({ days }: { readonly days: number }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? "Ativando..." : `Usar crédito (${days} dias)`}
    </Button>
  );
}

export function BoostAdvertisementForm({
  advertisementId,
  paidLabel,
  freeCredits = 0,
  referralDays = 15,
}: BoostAdvertisementFormProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {freeCredits > 0 && (
        <form action={redeemReferralPremiumAction}>
          <input type="hidden" name="advertisementId" value={advertisementId} />
          <CreditSubmitButton days={referralDays} />
        </form>
      )}
      <form action={boostAdvertisementAction}>
        <input type="hidden" name="advertisementId" value={advertisementId} />
        <PaidSubmitButton label={paidLabel} />
      </form>
    </div>
  );
}
