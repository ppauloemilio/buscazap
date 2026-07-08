export const CATEGORY_ICON_OPTIONS = [
  { value: "Heart", label: "Coração (saúde)" },
  { value: "Sparkles", label: "Brilho (beleza)" },
  { value: "Hammer", label: "Martelo (construção)" },
  { value: "UtensilsCrossed", label: "Talheres (alimentação)" },
  { value: "Laptop", label: "Notebook (tecnologia)" },
  { value: "GraduationCap", label: "Formatura (educação)" },
  { value: "Car", label: "Carro (automotivo)" },
  { value: "Shirt", label: "Camisa (moda)" },
  { value: "Tag", label: "Etiqueta (padrão)" },
] as const;

export const CATEGORY_AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE_CATEGORY: "Categoria criada",
  UPDATE_CATEGORY: "Categoria atualizada",
  DELETE_CATEGORY: "Categoria excluída",
};

export const CATEGORY_AUDIT_ENTITY_LABEL = "Categoria";

export function getCategoryIconLabel(icon: string): string {
  return (
    CATEGORY_ICON_OPTIONS.find((option) => option.value === icon)?.label ?? "Ícone personalizado"
  );
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

    return parts.length > 0 ? parts.join(" · ") : null;
  } catch {
    return null;
  }
}
