"use client";

import { Button } from "@/components/ui/button";

interface AdminDeleteButtonProps {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly id: string;
  readonly label: string;
  readonly confirmMessage: string;
}

export function AdminDeleteButton({
  action,
  id,
  label,
  confirmMessage,
}: AdminDeleteButtonProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline" className="text-destructive">
        {label}
      </Button>
    </form>
  );
}
