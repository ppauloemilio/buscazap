"use client";

import { useRef } from "react";
import { Bold, Italic, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DescriptionEditorProps {
  readonly name?: string;
  readonly id?: string;
  readonly defaultValue?: string;
  readonly required?: boolean;
  readonly minLength?: number;
  readonly rows?: number;
  readonly placeholder?: string;
  readonly className?: string;
}

export function DescriptionEditor({
  name = "description",
  id = "description",
  defaultValue = "",
  required,
  minLength = 20,
  rows = 8,
  placeholder = "Descreva o serviço. Use Enter para quebrar linha.",
  className,
}: DescriptionEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(before: string, after = before) {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = el.value;
    const selected = value.slice(start, end) || "texto";
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    el.value = next;
    el.focus();
    const cursor = start + before.length + selected.length + after.length;
    el.setSelectionRange(cursor, cursor);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function insertLinePrefix(prefix: string) {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const value = el.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    el.value = next;
    el.focus();
    const cursor = start + prefix.length;
    el.setSelectionRange(cursor, cursor);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => wrapSelection("**")}
          title="Negrito"
        >
          <Bold className="h-3.5 w-3.5" />
          Negrito
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => wrapSelection("*")}
          title="Itálico"
        >
          <Italic className="h-3.5 w-3.5" />
          Itálico
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => insertLinePrefix("• ")}
          title="Item de lista"
        >
          <List className="h-3.5 w-3.5" />
          Lista
        </Button>
      </div>

      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        minLength={minLength}
        rows={rows}
        placeholder={placeholder}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed"
      />

      <p className="text-[11px] text-muted-foreground">
        Use Enter para quebrar linha. Negrito: **texto** · Itálico: *texto*
      </p>
    </div>
  );
}
