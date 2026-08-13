"use client";

import { useId, useState } from "react";
import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import {
  formatMaxImageSizeLabel,
  validateImageFileClient,
  validateImageFilesClient,
} from "@/shared/utils/image-file-validation";
import { cn } from "@/lib/utils";

const ACCEPT = ADVERTISEMENT_IMAGE_LIMITS.allowedMimeTypes.join(",");

interface ImageFileInputProps {
  readonly id?: string;
  readonly name: string;
  readonly label?: string;
  readonly hint?: string;
  readonly required?: boolean;
  readonly multiple?: boolean;
  readonly className?: string;
  readonly inputClassName?: string;
}

export function ImageFileInput({
  id: idProp,
  name,
  label = "Imagem",
  hint,
  required = false,
  multiple = false,
  className,
  inputClassName,
}: ImageFileInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = input.files ? Array.from(input.files) : [];

    if (files.length === 0) {
      setError(null);
      return;
    }

    const validationError = multiple
      ? validateImageFilesClient(files, label)
      : validateImageFileClient(files[0]!, label);

    if (validationError) {
      setError(validationError);
      input.value = "";
      return;
    }

    setError(null);
  }

  const defaultHint = `JPG, PNG ou WebP · máx. ${formatMaxImageSizeLabel()}`;

  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <input
        id={id}
        name={name}
        type="file"
        accept={ACCEPT}
        required={required}
        multiple={multiple}
        onChange={handleChange}
        className={cn(
          "block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium",
          inputClassName
        )}
      />
      <p className="mt-0.5 text-xs text-muted-foreground">{hint ?? defaultHint}</p>
      {error && (
        <p className="mt-1 text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Impede submit se algum input de imagem do formulário for inválido. */
export function validateFormImageInputs(form: HTMLFormElement): string | null {
  const inputs = form.querySelectorAll<HTMLInputElement>(
    'input[type="file"][accept*="image"]'
  );

  for (const input of inputs) {
    const files = input.files ? Array.from(input.files) : [];
    if (files.length === 0) continue;

    const label =
      form.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() ||
      "Imagem";

    const error = input.multiple
      ? validateImageFilesClient(files, label)
      : validateImageFileClient(files[0]!, label);

    if (error) return error;
  }

  return null;
}
