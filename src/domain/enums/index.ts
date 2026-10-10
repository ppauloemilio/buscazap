export enum ProviderStatus {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
}

export enum UserRole {
  ADMIN = "ADMIN",
  CONSUMER = "CONSUMER",
  PROVIDER = "PROVIDER",
}

export enum AdvertisementStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  BLOCKED = "BLOCKED",
  PREMIUM = "PREMIUM",
  INACTIVE = "INACTIVE",
}

export enum AdvertisementType {
  PROFESSIONAL = "PROFESSIONAL",
  COMPANY = "COMPANY",
  PRODUCT = "PRODUCT",
  SERVICE = "SERVICE",
}

/** Área onde o anunciante atende. */
export enum ServiceArea {
  NEIGHBORHOOD_ONLY = "NEIGHBORHOOD_ONLY",
  NEARBY = "NEARBY",
  CITY_WIDE = "CITY_WIDE",
  ON_SITE = "ON_SITE",
  ON_REQUEST = "ON_REQUEST",
}

export enum ProviderLeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  CONVERTED = "CONVERTED",
  DISMISSED = "DISMISSED",
}

export enum SubscriptionTier {
  BASIC = "BASIC",
  PLUS = "PLUS",
}

/** Painel: SIMPLE = listagem grátis (5 campos); FULL = perfil completo (não regride ao vencer). */
export enum ListingProfile {
  SIMPLE = "SIMPLE",
  FULL = "FULL",
}

export enum PaymentType {
  SUBSCRIPTION = "SUBSCRIPTION",
  PREMIUM_BOOST = "PREMIUM_BOOST",
}

/** Valor em Payment.referenceId para assinaturas PIX. */
export const SUBSCRIPTION_TIER_REFERENCE = {
  BASIC: "BASIC",
  PLUS: "PLUS",
} as const;

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}
