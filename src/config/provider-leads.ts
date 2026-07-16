import { ProviderLeadStatus } from "@/domain/enums";

export const PROVIDER_LEAD_STATUS_OPTIONS = [
  { value: ProviderLeadStatus.NEW, label: "Novo" },
  { value: ProviderLeadStatus.CONTACTED, label: "Contatado" },
  { value: ProviderLeadStatus.CONVERTED, label: "Convertido" },
  { value: ProviderLeadStatus.DISMISSED, label: "Arquivado" },
] as const;

export const PROVIDER_LEAD_STATUS_LABELS: Record<string, string> = {
  [ProviderLeadStatus.NEW]: "Novo",
  [ProviderLeadStatus.CONTACTED]: "Contatado",
  [ProviderLeadStatus.CONVERTED]: "Convertido",
  [ProviderLeadStatus.DISMISSED]: "Arquivado",
};
