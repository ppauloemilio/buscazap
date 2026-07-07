"use client";

import { useFormStatus } from "react-dom";
import { boostAdvertisementAction } from "@/actions/provider-actions";
import { Button } from "@/components/ui/button";

interface BoostAdvertisementFormProps {
  readonly advertisementId: string;
  readonly label: string;
}

function SubmitButton({ label }: { readonly label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="whatsapp" size="sm" disabled={pending}>
      {pending ? "Gerando PIX..." : label}
    </Button>
  );
}

export function BoostAdvertisementForm({
  advertisementId,
  label,
}: BoostAdvertisementFormProps) {
  return (
    <form action={boostAdvertisementAction}>
      <input type="hidden" name="advertisementId" value={advertisementId} />
      <SubmitButton label={label} />
    </form>
  );
}
