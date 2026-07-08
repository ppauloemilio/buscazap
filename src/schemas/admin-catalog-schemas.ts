import { z } from "zod";
import { slugify } from "@/lib/slugify";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  slug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? slugify(value) : undefined)),
  icon: z.string().trim().min(2).max(40).default("Tag"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().min(1),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true"
    ),
});

export const createStateSchema = z.object({
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "UF inválida"),
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const updateStateSchema = createStateSchema.extend({
  id: z.string().min(1),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true"
    ),
});

export const createCitySchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  stateId: z.string().min(1, "Selecione o estado"),
});

export const updateCitySchema = createCitySchema.extend({
  id: z.string().min(1),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true"
    ),
});

export function resolveCategorySlug(name: string, slug?: string) {
  return slug && slug.length > 0 ? slug : slugify(name);
}
