"use client";

import { useMemo, useState } from "react";
import {
  ALL_WHATSAPP_EMOJIS,
  DEFAULT_CATEGORY_EMOJI,
  isLikelyEmojiIcon,
  resolveCategoryEmoji,
  WHATSAPP_EMOJI_GROUPS,
} from "@/config/whatsapp-emojis";
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
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>(
    WHATSAPP_EMOJI_GROUPS[0]?.id ?? "smileys"
  );

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

  return (
    <div className="space-y-2">
      <input type="hidden" id={id} name={name} value={value} />

      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-xl">
          {value}
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && pastedCandidate) {
              event.preventDefault();
              setValue(pastedCandidate);
              setQuery("");
            }
          }}
          placeholder="Buscar ou cole um emoji"
          className="h-10"
        />
      </div>

      {pastedCandidate && (
        <button
          type="button"
          onClick={() => {
            setValue(pastedCandidate);
            setQuery("");
          }}
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-whatsapp/40 bg-whatsapp/5 px-2 py-1.5 text-left text-xs hover:bg-whatsapp/10"
        >
          <span className="text-lg">{pastedCandidate}</span>
          <span className="text-muted-foreground">Usar emoji colado</span>
        </button>
      )}

      {!filtered && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {WHATSAPP_EMOJI_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveGroup(group.id)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
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

      <div className="max-h-40 overflow-y-auto rounded-md border bg-background p-1.5">
        <div className="grid grid-cols-8 gap-0.5 sm:grid-cols-10">
          {visibleEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              onClick={() => {
                setValue(emoji);
                setQuery("");
              }}
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

      <p className="text-[11px] text-muted-foreground">
        Emojis no estilo WhatsApp — escolha o mais adequado à categoria.
      </p>
    </div>
  );
}
