import Image from "next/image";
import { cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, string> = {
  Saúde: "from-rose-400/40 to-red-600/30",
  Beleza: "from-pink-400/40 to-fuchsia-600/30",
  Construção: "from-amber-400/40 to-orange-600/30",
  Alimentação: "from-yellow-400/40 to-amber-600/30",
  Tecnologia: "from-blue-400/40 to-indigo-600/30",
  Educação: "from-violet-400/40 to-purple-600/30",
  Automotivo: "from-slate-400/40 to-zinc-600/30",
  Moda: "from-teal-400/40 to-cyan-600/30",
};

interface AdvertisementCoverProps {
  readonly title: string;
  readonly category: string;
  readonly imageUrl?: string;
  readonly className?: string;
  readonly priority?: boolean;
  readonly compact?: boolean;
}

export function AdvertisementCover({
  title,
  category,
  imageUrl,
  className,
  priority = false,
  compact = false,
}: AdvertisementCoverProps) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={`Capa do anúncio ${title}`}
        fill
        className={cn("object-cover", className)}
        sizes={
          compact
            ? "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            : "(max-width: 768px) 100vw, 33vw"
        }
        priority={priority}
      />
    );
  }

  const gradient = CATEGORY_STYLES[category] ?? "from-whatsapp/30 to-whatsapp/10";
  const initial = title.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br",
        gradient,
        className
      )}
      aria-hidden
    >
      <span
        className={cn(
          "select-none font-bold text-white/70",
          compact ? "text-3xl md:text-4xl" : "text-5xl md:text-6xl"
        )}
      >
        {initial}
      </span>
    </div>
  );
}
