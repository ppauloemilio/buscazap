import { z } from "zod";
import { AdvertisementType } from "@/domain/enums";

export const registerProviderSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export const loginProviderSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

const optionalAge = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  },
  z
    .number({ invalid_type_error: "Idade inválida" })
    .int("Idade deve ser um número inteiro")
    .min(18, "Idade mínima: 18 anos")
    .max(120, "Idade inválida")
    .optional()
);

const optionalTrimmedString = (min: number, message: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().min(min, message).optional()
  );

export const updateProviderProfileSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  age: optionalAge,
  state: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .length(2, "UF deve ter 2 letras")
      .optional()
  ),
  city: optionalTrimmedString(2, "Cidade deve ter ao menos 2 caracteres"),
  neighborhood: optionalTrimmedString(2, "Bairro deve ter ao menos 2 caracteres"),
  bio: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().max(500, "Bio deve ter no máximo 500 caracteres").optional()
  ),
});

export const updateProviderPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(6, "Nova senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const createAdvertisementSchema = z.object({
  title: z.string().min(5, "Título deve ter ao menos 5 caracteres"),
  description: z.string().min(20, "Descrição deve ter ao menos 20 caracteres"),
  type: z.nativeEnum(AdvertisementType),
  category: z.string().min(2, "Selecione uma categoria"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().length(2, "UF deve ter 2 letras"),
  neighborhood: z.string().optional(),
  whatsappNumber: z.string().min(10, "WhatsApp inválido"),
  withPremium: z.boolean().optional(),
});

export type RegisterProviderInput = z.infer<typeof registerProviderSchema>;
export type LoginProviderInput = z.infer<typeof loginProviderSchema>;
export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;
export type UpdateProviderPasswordInput = z.infer<typeof updateProviderPasswordSchema>;
export type CreateAdvertisementInput = z.infer<typeof createAdvertisementSchema>;
