import type { AdvertisementStatus, AdvertisementType } from "@/domain/enums";

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly icon: string;
  readonly count: number;
}

export interface Location {
  readonly city: string;
  readonly state: string;
  readonly neighborhood?: string;
}

export interface Advertisement {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly type: AdvertisementType;
  readonly status: AdvertisementStatus;
  readonly category: string;
  readonly location: Location;
  readonly rating: number;
  readonly reviewCount: number;
  readonly imageUrl?: string;
  readonly whatsappNumber: string;
  readonly isPremium: boolean;
  readonly premiumExpiresAt?: string;
  readonly providerId?: string;
  readonly createdAt: string;
}

export interface DashboardStats {
  readonly totalAdvertisements: number;
  readonly totalProviders: number;
  readonly totalCities: number;
  readonly totalCategories: number;
}

export interface SearchFilters {
  readonly query: string;
  readonly category?: string;
  readonly city?: string;
  readonly neighborhood?: string;
  readonly type?: AdvertisementType;
}
