"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_WHATSAPP_EMOJIS,
  DEFAULT_CATEGORY_EMOJI,
  isLikelyEmojiIcon,
  resolveCategoryEmoji,
  WHATSAPP_EMOJI_GROUPS,
} from "@/config/whatsapp-emojis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CategoryIconPickerProps {
  readonly name?: string;
  readonly defaultValue?: string;
  readonly id?: string;
}

export function CategoryIconPicker({
  name = "icon",
  defaultValue = DEFAULT_CATEGORY_EMOJI,
  id,
}: CategoryIconPickerProps) {
  const initial = resolveCategoryEmoji(defaultValue);
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>(
    WHATSAPP_EMOJI_GROUPS[0]?.id ?? "smileys"
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return ALL_WHATSAPP_EMOJIS.filter(
      (emoji) => emoji.includes(q) || q.includes(emoji)
    );
  }, [query]);

  const pastedCandidate = useMemo(() => {
    const q = query.trim();
    if (!q || !isLikelyEmojiIcon(q)) return null;
    if (ALL_WHATSAPP_EMOJIS.includes(q)) return null;
    return q;
  }, [query]);

  const visibleEmojis =
    filtered ??
    WHATSAPP_EMOJI_GROUPS.find((group) => group.id === activeGroup)?.emojis ??
    [];

  function selectEmoji(emoji: string) {
    setValue(emoji);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <input type="hidden" id={id} name={name} value={value} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-xl transition-colors hover:bg-muted",
            open && "border-whatsapp ring-1 ring-whatsapp"
          )}
          aria-expanded={open}
          aria-label="Escolher emoji"
          title="Escolher emoji"
        >
          {value}
        </button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Fechar" : "Alterar emoji"}
        </Button>
        {!open && (
          <span className="truncate text-xs text-muted-foreground">
            Clique para escolher entre os emojis do WhatsApp
          </span>
        )}
      </div>

      {open && (
        <div className="z-20 space-y-2 rounded-md border bg-background p-2 shadow-sm">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && pastedCandidate) {
                event.preventDefault();
                selectEmoji(pastedCandidate);
              }
            }}
            placeholder="Buscar ou cole um emoji"
            className="h-9"
            autoFocus
          />

          {pastedCandidate && (
            <button
              type="button"
              onClick={() => selectEmoji(pastedCandidate)}
              className="flex w-full items-center gap-2 rounded-md border border-dashed border-whatsapp/40 bg-whatsapp/5 px-2 py-1.5 text-left text-xs hover:bg-whatsapp/10"
            >
              <span className="text-lg">{pastedCandidate}</span>
              <span className="text-muted-foreground">Usar emoji colado</span>
            </button>
          )}

          {!filtered && (
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {WHATSAPP_EMOJI_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroup(group.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                    activeGroup === group.id
                      ? "border-whatsapp bg-whatsapp/10 text-whatsapp"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {group.label}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-36 overflow-y-auto rounded-md border bg-muted/20 p-1">
            <div className="grid grid-cols-8 gap-0.5 sm:grid-cols-10">
              {visibleEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  type="button"
                  onClick={() => selectEmoji(emoji)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded text-lg hover:bg-muted",
                    value === emoji && "bg-whatsapp/15 ring-1 ring-whatsapp"
                  )}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {visibleEmojis.length === 0 && !pastedCandidate && (
              <p className="p-2 text-center text-xs text-muted-foreground">
                Nenhum emoji encontrado. Cole um emoji no campo e use a opção acima.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
