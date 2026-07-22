"use client";

import { Trash2 } from "lucide-react";
import { adminDeleteProviderLeadAction } from "@/actions/provider-lead-actions";
import { Button } from "@/components/ui/button";

interface AdminDeleteLeadFormProps {
  readonly leadId: string;
  readonly leadTitle: string;
}

export function AdminDeleteLeadForm({
  leadId,
  leadTitle,
}: AdminDeleteLeadFormProps) {
  return (
    <form
      action={adminDeleteProviderLeadAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Excluir definitivamente o lead "${leadTitle}"? Esta ação não pode ser desfeita.`
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="leadId" value={leadId} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Excluir lead
      </Button>
    </form>
  );
}
