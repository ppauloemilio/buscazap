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
  ON_REQUEST = "ON_REQUEST",
}

export enum PaymentType {
  SUBSCRIPTION = "SUBSCRIPTION",
  PREMIUM_BOOST = "PREMIUM_BOOST",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}
