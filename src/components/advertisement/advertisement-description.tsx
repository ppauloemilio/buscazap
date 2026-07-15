import { Fragment } from "react";
import { cn } from "@/lib/utils";

/**
 * Renderiza descrição com quebras de linha e marcadores simples:
 * **negrito** e *itálico*
 */
export function formatAdvertisementDescriptionNodes(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  return lines.map((line, lineIndex) => (
    <Fragment key={`line-${lineIndex}`}>
      {lineIndex > 0 ? <br /> : null}
      {formatInline(line, lineIndex)}
    </Fragment>
  ));
}

function formatInline(line: string, lineIndex: number) {
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    const key = `${lineIndex}-${index}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

interface AdvertisementDescriptionProps {
  readonly text: string;
  readonly className?: string;
}

export function AdvertisementDescription({
  text,
  className,
}: AdvertisementDescriptionProps) {
  return (
    <div className={cn("break-words text-muted-foreground", className)}>
      {formatAdvertisementDescriptionNodes(text)}
    </div>
  );
}
