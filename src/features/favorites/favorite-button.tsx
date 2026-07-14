"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "buscazap_favorites";

function getSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function writeFavorites(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("buscazap-favorites"));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("buscazap-favorites", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("buscazap-favorites", callback);
  };
}

export function useFavoriteIds(): string[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  return useMemo(() => {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }, [raw]);
}

export function toggleFavorite(advertisementId: string): boolean {
  let current: string[] = [];
  try {
    const parsed = JSON.parse(getSnapshot()) as unknown;
    current = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    current = [];
  }
  const exists = current.includes(advertisementId);
  const next = exists
    ? current.filter((id) => id !== advertisementId)
    : [...current, advertisementId];
  writeFavorites(next);
  return !exists;
}

interface FavoriteButtonProps {
  readonly advertisementId: string;
  readonly className?: string;
  readonly size?: "sm" | "icon";
}

export function FavoriteButton({
  advertisementId,
  className,
  size = "icon",
}: FavoriteButtonProps) {
  const favorites = useFavoriteIds();
  const active = favorites.includes(advertisementId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      type="button"
      variant="outline"
      size={size === "sm" ? "sm" : "icon"}
      className={cn(
        size === "icon" && "h-7 w-7",
        size === "sm" && "h-7 px-2 text-[11px]",
        className
      )}
      aria-label={active ? "Remover dos favoritos" : "Salvar nos favoritos"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(advertisementId);
      }}
    >
      <Heart
        className={cn(
          "h-3.5 w-3.5",
          mounted && active && "fill-red-500 text-red-500"
        )}
      />
      {size === "sm" && (
        <span>{mounted && active ? "Salvo" : "Salvar"}</span>
      )}
    </Button>
  );
}
