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
export type CreateAdvertisementInput = z.infer<typeof createAdvertisementSchema>;
