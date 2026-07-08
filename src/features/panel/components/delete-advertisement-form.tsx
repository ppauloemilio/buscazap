"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteAdvertisementAction } from "@/actions/provider-actions";
import { Button } from "@/components/ui/button";

interface DeleteAdvertisementFormProps {
  readonly advertisementId: string;
  readonly advertisementTitle: string;
  readonly premiumActive: boolean;
  readonly premiumAmountLabel: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "Excluindo..." : "Excluir"}
    </Button>
  );
}

export function DeleteAdvertisementForm({
  advertisementId,
  advertisementTitle,
  premiumActive,
  premiumAmountLabel,
}: DeleteAdvertisementFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const message = premiumActive
      ? `O anúncio "${advertisementTitle}" possui destaque premium ativo. Ao excluir, você perderá o valor investido (${premiumAmountLabel}) sem reembolso.\n\nDeseja continuar com a exclusão?`
      : `Tem certeza que deseja excluir o anúncio "${advertisementTitle}"?`;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteAdvertisementAction} onSubmit={handleSubmit}>
      <input type="hidden" name="advertisementId" value={advertisementId} />
      <SubmitButton />
    </form>
  );
}
