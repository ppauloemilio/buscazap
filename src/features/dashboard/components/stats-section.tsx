import {
  Users,
  MapPin,
  LayoutGrid,
  Megaphone,
} from "lucide-react";
import type { DashboardStats } from "@/domain/entities";
import { formatNumber } from "@/shared/utils/format";

interface StatsSectionProps {
  readonly stats: DashboardStats;
}

const STAT_ITEMS = [
  { key: "totalAdvertisements" as const, label: "Anúncios ativos", icon: Megaphone },
  { key: "totalProviders" as const, label: "Anunciantes", icon: Users },
  { key: "totalCities" as const, label: "Cidades", icon: MapPin },
  { key: "totalCategories" as const, label: "Categorias", icon: LayoutGrid },
];

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="border-y bg-muted/20 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STAT_ITEMS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 text-center shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp/10">
                <Icon className="h-5 w-5 text-whatsapp" />
              </div>
              <span className="text-2xl font-bold text-foreground md:text-3xl">
                {formatNumber(stats[key])}+
              </span>
              <span className="text-xs text-muted-foreground md:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
