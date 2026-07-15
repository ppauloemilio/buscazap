import {
  DEFAULT_CATEGORY_EMOJI,
  resolveCategoryEmoji,
} from "@/config/whatsapp-emojis";

/** @deprecated Mantido para imports antigos; preferir emojis WhatsApp. */
export const CATEGORY_ICON_OPTIONS = [
  { value: "❤️", label: "❤️ Saúde" },
  { value: "✨", label: "✨ Beleza" },
  { value: "🔨", label: "🔨 Construção" },
  { value: "🍽️", label: "🍽️ Alimentação" },
  { value: "💻", label: "💻 Tecnologia" },
  { value: "🎓", label: "🎓 Educação" },
  { value: "🚗", label: "🚗 Automotivo" },
  { value: "👕", label: "👕 Moda" },
  { value: DEFAULT_CATEGORY_EMOJI, label: `${DEFAULT_CATEGORY_EMOJI} Geral` },
] as const;

export const CATEGORY_AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE_CATEGORY: "Categoria criada",
  UPDATE_CATEGORY: "Categoria atualizada",
  DELETE_CATEGORY: "Categoria excluída",
  PROMOTE_CATEGORY_SUGGESTION: "Sugestão promovida a categoria oficial",
  MERGE_CATEGORY_SUGGESTION: "Sugestão mesclada em categoria existente",
  DISMISS_CATEGORY_SUGGESTION: "Sugestão de categoria dispensada",
};

export const CATEGORY_AUDIT_ENTITY_LABEL = "Categoria";

export const CATEGORY_SUGGESTION_AUDIT_ENTITY_LABEL = "Sugestão de categoria";

export function getCategoryIconLabel(icon: string): string {
  const emoji = resolveCategoryEmoji(icon);
  return emoji;
}

export function getCategoryAuditActionLabel(action: string): string | undefined {
  return CATEGORY_AUDIT_ACTION_LABELS[action];
}

export function formatCategoryAuditMetadata(metadata: string | null): string | null {
  if (!metadata) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>;
    const parts: string[] = [];

    if (typeof parsed.name === "string") {
      parts.push(`Nome: ${parsed.name}`);
    }

    if (typeof parsed.slug === "string") {
      parts.push(`Identificador na URL: ${parsed.slug}`);
    }

    if (typeof parsed.isActive === "boolean") {
      parts.push(parsed.isActive ? "Situação: ativa" : "Situação: inativa");
    }

    if (typeof parsed.suggestionName === "string") {
      parts.push(`Sugestão: ${parsed.suggestionName}`);
    }

    if (typeof parsed.categoryName === "string") {
      parts.push(`Categoria criada: ${parsed.categoryName}`);
    }

    if (typeof parsed.mergedIntoName === "string") {
      parts.push(`Mesclada em: ${parsed.mergedIntoName}`);
    }

    return parts.length > 0 ? parts.join(" · ") : null;
  } catch {
    return null;
  }
}
