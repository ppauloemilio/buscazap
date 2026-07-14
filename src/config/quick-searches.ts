import {
  Flame,
  Droplets,
  Bike,
  Pill,
  Zap,
  Wrench,
} from "lucide-react";

export const URGENT_SEARCHES = [
  { label: "Gás", query: "gás", icon: Flame },
  { label: "Água", query: "água", icon: Droplets },
  { label: "Delivery", query: "delivery", icon: Bike },
  { label: "Farmácia", query: "farmácia", icon: Pill },
  { label: "Eletricista", query: "eletricista", icon: Zap },
  { label: "Encanação", query: "encanador", icon: Wrench },
] as const;

export const POPULAR_SEARCHES = [
  "Eletricista",
  "Dentista",
  "Delivery",
  "Mecânico",
  "Gás",
  "Água",
] as const;
