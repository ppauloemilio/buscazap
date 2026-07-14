"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { createReviewAction } from "@/actions/review-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  readonly advertisementId: string;
}

export function ReviewForm({ advertisementId }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("advertisementId", advertisementId);
    formData.set("rating", String(rating));

    startTransition(async () => {
      const result = await createReviewAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  if (saved) {
    return (
      <p className="rounded-lg bg-whatsapp/10 p-3 text-sm text-whatsapp">
        Obrigado! Sua avaliação foi publicada.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-2.5">
      <div>
        <p className="mb-1 text-sm font-medium">Sua nota</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded p-1 hover:bg-muted"
              aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  value <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="authorName" className="mb-1 block text-sm font-medium">
          Seu nome
        </label>
        <Input id="authorName" name="authorName" required maxLength={60} />
      </div>

      <div>
        <label htmlFor="comment" className="mb-1 block text-sm font-medium">
          Comentário (opcional)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={2}
          maxLength={400}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Como foi o atendimento?"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </form>
  );
}
