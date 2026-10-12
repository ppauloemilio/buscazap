import { PRICING } from "@/config/pricing";

export const FREE_PLAN_TAGLINE =
  "Ideal para começar rápido e aparecer na busca.";

export const FREE_PLAN_BENEFITS = [
  "Listagem básica na busca",
  "Nome, categoria, bairro e WhatsApp",
  "Disponível nas cidades ativas do catálogo",
  "Upgrade para o Plano Básico quando quiser",
] as const;

export const BASIC_PLAN_BENEFITS = [
  "Perfil completo com Foto de Capa",
  "Logomarca",
  `${PRICING.PROVIDER_MAX_COMPANY_PHOTOS} Fotos da Empresa`,
  "Horários de Funcionamento",
  "Link do Instagram",
  "Link do site",
  `Divulgação de ${PRICING.PAID_MAX_PRODUCTS} Produtos`,
  `Divulgação de ${PRICING.PAID_MAX_SERVICES} Serviços`,
] as const;

/** Extras do Pro em relação ao Básico (copy comercial). */
export const PRO_PLAN_EXTRA_BENEFITS = [
  "Tudo do Plano Básico",
  `+ Divulgação de ${PRICING.PLUS_MAX_PROMOTIONS} PROMOÇÕES`,
  "+ 6 Fotos da Empresa",
  "+ Divulgação de 3 Produtos",
  "+ Divulgação de 3 Serviços",
] as const;
