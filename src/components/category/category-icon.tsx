import {
  DEFAULT_CATEGORY_EMOJI,
  resolveCategoryEmoji,
} from "@/config/whatsapp-emojis";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  readonly icon: string;
  readonly className?: string;
  readonly size?: "sm" | "md" | "lg";
}

const SIZE_CLASS = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
} as const;

export function CategoryIcon({
  icon,
  className,
  size = "md",
}: CategoryIconProps) {
  const emoji = resolveCategoryEmoji(icon) || DEFAULT_CATEGORY_EMOJI;

  return (
    <span
      className={cn("leading-none", SIZE_CLASS[size], className)}
      role="img"
      aria-hidden
    >
      {emoji}
    </span>
  );
}
