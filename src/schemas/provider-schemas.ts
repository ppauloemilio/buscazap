import { z } from "zod";
import { AdvertisementType } from "@/domain/enums";
import { CATEGORY_OTHER_VALUE } from "@/config/advertisement-form";
import { isPilotCity } from "@/config/pricing";
import { normalizeWhatsAppIdentity } from "@/lib/whatsapp";

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().email("E-mail inválido").nullable());

const whatsappIdentity = z
  .string()
  .min(1, "Informe o WhatsApp")
  .transform((value, ctx) => {
    const normalized = normalizeWhatsAppIdentity(value);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WhatsApp inválido. Use DDD + número (ex.: 91 99999-9999)",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const registerProviderSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: optionalEmail,
  whatsapp: whatsappIdentity,
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  referralCode: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim().toUpperCase();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().min(4, "Código de indicação inválido").max(16).optional()
  ),
});

/** Login do anunciante: WhatsApp ou e-mail + senha */
export const loginProviderSchema = z.object({
  login: z.string().trim().min(3, "Informe WhatsApp ou e-mail"),
  password: z.string().min(1, "Informe a senha"),
});

/** Login do admin continua por e-mail */
export const loginAdminSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export const requestPasswordResetSchema = z.object({
  login: z.string().trim().min(3, "Informe WhatsApp ou e-mail"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Link inválido"),
    newPassword: z.string().min(6, "Nova senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
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
  name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: optionalEmail,
  whatsapp: whatsappIdentity,
  age: optionalAge,
  state: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().length(2, "UF deve ter 2 letras").optional()
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
  businessHours: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().max(120, "Horário deve ter no máximo 120 caracteres").optional()
  ),
  responseHint: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().max(120, "Dica de resposta deve ter no máximo 120 caracteres").optional()
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

export const createAdvertisementSchema = z
  .object({
    title: z.string().min(5, "Título deve ter ao menos 5 caracteres"),
    description: z
      .string()
      .min(20, "Descrição deve ter ao menos 20 caracteres")
      .max(5000, "Descrição muito longa"),
    type: z.nativeEnum(AdvertisementType),
    category: z.string().min(1, "Selecione uma categoria"),
    customCategory: z.preprocess(
      (value) => {
        if (typeof value !== "string") return undefined;
        const trimmed = value.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      },
      z.string().min(2, "Categoria deve ter ao menos 2 caracteres").max(50).optional()
    ),
    city: z.string().min(2, "Informe a cidade"),
    state: z.string().length(2, "UF deve ter 2 letras"),
    neighborhood: z.string().optional(),
    whatsappNumber: z.string().min(10, "WhatsApp inválido"),
    withPremium: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category === CATEGORY_OTHER_VALUE && !data.customCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a categoria desejada",
        path: ["customCategory"],
      });
    }

    if (!isPilotCity(data.city, data.state)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No momento, anúncios só podem ser criados em Belém ou Ananindeua (PA)",
        path: ["city"],
      });
    }
  });

export const adminCreateProviderSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: optionalEmail,
  whatsapp: whatsappIdentity,
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  grantTrial: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
});

export const adminResetProviderPasswordSchema = z.object({
  providerId: z.string().min(1),
  newPassword: z.string().min(6, "Nova senha deve ter ao menos 6 caracteres"),
});

export const adminCreateAdvertisementSchema = z
  .object({
    providerId: z.string().min(1, "Selecione o anunciante"),
    title: z.string().min(5, "Título deve ter ao menos 5 caracteres"),
    description: z
      .string()
      .min(20, "Descrição deve ter ao menos 20 caracteres")
      .max(5000, "Descrição muito longa"),
    type: z.nativeEnum(AdvertisementType),
    category: z.string().min(1, "Selecione uma categoria"),
    customCategory: z.preprocess(
      (value) => {
        if (typeof value !== "string") return undefined;
        const trimmed = value.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      },
      z.string().min(2, "Categoria deve ter ao menos 2 caracteres").max(50).optional()
    ),
    city: z.string().min(2, "Informe a cidade"),
    state: z.string().length(2, "UF deve ter 2 letras"),
    neighborhood: z.string().optional(),
    whatsappNumber: z.string().min(10, "WhatsApp inválido"),
  })
  .superRefine((data, ctx) => {
    if (data.category === CATEGORY_OTHER_VALUE && !data.customCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a categoria desejada",
        path: ["customCategory"],
      });
    }

    if (!isPilotCity(data.city, data.state)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No momento, anúncios só podem ser criados em Belém ou Ananindeua (PA)",
        path: ["city"],
      });
    }
  });

export const adminUpdateAdvertisementSchema = z
  .object({
    advertisementId: z.string().min(1),
    title: z.string().min(5, "Título deve ter ao menos 5 caracteres"),
    description: z
      .string()
      .min(20, "Descrição deve ter ao menos 20 caracteres")
      .max(5000, "Descrição muito longa"),
    type: z.nativeEnum(AdvertisementType),
    category: z.string().min(1, "Selecione uma categoria"),
    customCategory: z.preprocess(
      (value) => {
        if (typeof value !== "string") return undefined;
        const trimmed = value.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      },
      z.string().min(2, "Categoria deve ter ao menos 2 caracteres").max(50).optional()
    ),
    city: z.string().min(2, "Informe a cidade"),
    state: z.string().length(2, "UF deve ter 2 letras"),
    neighborhood: z.string().optional(),
    whatsappNumber: z.string().min(10, "WhatsApp inválido"),
  })
  .superRefine((data, ctx) => {
    if (data.category === CATEGORY_OTHER_VALUE && !data.customCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a categoria desejada",
        path: ["customCategory"],
      });
    }

    if (!isPilotCity(data.city, data.state)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No momento, anúncios só podem ser criados em Belém ou Ananindeua (PA)",
        path: ["city"],
      });
    }
  });

export function resolveAdvertisementCategory(input: {
  readonly category: string;
  readonly customCategory?: string;
}): string {
  if (input.category === CATEGORY_OTHER_VALUE) {
    return input.customCategory ?? "";
  }

  return input.category;
}

export type RegisterProviderInput = z.infer<typeof registerProviderSchema>;
export type LoginProviderInput = z.infer<typeof loginProviderSchema>;
export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;
export type UpdateProviderPasswordInput = z.infer<typeof updateProviderPasswordSchema>;
export type CreateAdvertisementInput = z.infer<typeof createAdvertisementSchema>;
export type AdminCreateProviderInput = z.infer<typeof adminCreateProviderSchema>;
