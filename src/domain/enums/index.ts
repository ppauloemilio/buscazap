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
