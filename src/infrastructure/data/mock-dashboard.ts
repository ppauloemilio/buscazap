import type {
  Category,
  DashboardStats,
} from "@/domain/entities";

export const DASHBOARD_STATS: DashboardStats = {
  totalAdvertisements: 12_450,
  totalProviders: 3_280,
  totalCities: 186,
  totalCategories: 42,
};

export const CATEGORIES: readonly Category[] = [
  { id: "1", name: "Saúde", slug: "saude", icon: "❤️", count: 1240 },
  { id: "2", name: "Beleza", slug: "beleza", icon: "✨", count: 890 },
  { id: "3", name: "Construção", slug: "construcao", icon: "🔨", count: 756 },
  { id: "4", name: "Alimentação", slug: "alimentacao", icon: "🍽️", count: 2100 },
  { id: "5", name: "Tecnologia", slug: "tecnologia", icon: "💻", count: 645 },
  { id: "6", name: "Educação", slug: "educacao", icon: "🎓", count: 520 },
  { id: "7", name: "Automotivo", slug: "automotivo", icon: "🚗", count: 430 },
  { id: "8", name: "Moda", slug: "moda", icon: "👕", count: 980 },
] as const;

export const POPULAR_CITIES: readonly string[] = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Brasília",
  "Curitiba",
  "Salvador",
  "Fortaleza",
  "Recife",
] as const;
