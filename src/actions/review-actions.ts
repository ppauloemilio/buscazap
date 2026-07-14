"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdvertisementReview } from "@/application/services/review-service";

const createReviewSchema = z.object({
  advertisementId: z.string().min(1),
  authorName: z
    .string()
    .trim()
    .min(2, "Informe seu nome")
    .max(60, "Nome muito longo"),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().max(400, "Comentário muito longo").optional()
  ),
});

export async function createReviewAction(formData: FormData) {
  const parsed = createReviewSchema.safeParse({
    advertisementId: formData.get("advertisementId"),
    authorName: formData.get("authorName"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    await createAdvertisementReview(parsed.data);
  } catch {
    return { error: "Não foi possível salvar a avaliação." };
  }

  revalidatePath(`/anuncio/${parsed.data.advertisementId}`);
  revalidatePath("/buscar");
  revalidatePath("/");

  return { ok: true as const };
}
